/**
 * API Client for communicating with the backend
 * 
 * This module provides functions to interact with the backend API.
 * All requests include authentication headers when a user session exists.
 */

import { supabase } from '@/react-app/lib/supabase';
import type { 
  Scan, 
  Vulnerability, 
  MobileScan, 
  MobileVulnerability,
  CreateScan,
  ScanType 
} from '@/shared/types';

/**
 * Helper to get the API base URL.
 * In development (Vite), it's relative or can be set via VITE_API_URL.
 * In production/deployment, it should be set via VITE_API_URL environment variable.
 * Must be a full URL (e.g. https://www.cybersec-back.evokeai.info) so the browser
 * does not treat it as a path under the frontend origin.
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  let baseUrl = (import.meta.env.VITE_API_URL as string) || '';
  baseUrl = baseUrl.trim();
  if (!baseUrl) {
    return cleanPath;
  }
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}${cleanPath}`;
}

/**
 * Return headers including Authorization if a Supabase session exists.
 * Pass null for contentType if you don't want Content-Type set (e.g. file downloads).
 */
export async function getAuthHeaders(contentType: string | null = 'application/json'): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = {};
  if (contentType) headers['Content-Type'] = contentType;
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const headers = await getAuthHeaders('application/json');
    
    const response = await fetch(getApiUrl(endpoint), {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    // Handle 401 Unauthorized - session expired
    if (response.status === 401) {
      // Clear invalid session
      await supabase.auth.signOut();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle non-JSON responses (e.g., file downloads)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response as unknown as T;
  } catch (error) {
    // Re-throw if it's already an Error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error occurred');
  }
}

// ==================== Web Scan APIs ====================

/**
 * Get all scans for the current user
 */
export async function getScans(): Promise<Scan[]> {
  return apiRequest<Scan[]>('/api/scans');
}

/**
 * Get a single scan by ID
 */
export async function getScan(id: number): Promise<Scan> {
  return apiRequest<Scan>(`/api/scans/${id}`);
}

/**
 * Get vulnerabilities for a scan
 */
export async function getScanVulnerabilities(scanId: number): Promise<Vulnerability[]> {
  return apiRequest<Vulnerability[]>(`/api/scans/${scanId}/vulnerabilities`);
}

/**
 * Create a new scan
 */
export async function createScan(data: CreateScan): Promise<Scan> {
  return apiRequest<Scan>('/api/scans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a scan
 */
export async function deleteScan(id: number): Promise<void> {
  await apiRequest(`/api/scans/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Perform a trial scan (without saving to database)
 */
export async function performTrialScan(data: CreateScan): Promise<{
  vulnerabilities: Vulnerability[];
  scan: {
    target_url: string;
    scan_type: ScanType;
    severity_critical: number;
    severity_high: number;
    severity_medium: number;
    severity_low: number;
    severity_info: number;
  };
}> {
  return apiRequest('/api/scans/trial', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Save a trial scan to the database
 */
export async function saveTrialScan(data: {
  target_url: string;
  scan_type: ScanType;
  vulnerabilities: Vulnerability[];
}): Promise<Scan> {
  return apiRequest<Scan>('/api/scans/save-trial', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Export scan report
 */
export async function exportScanReport(
  scanId: number,
  format: 'pdf' | 'json' | 'csv' | 'html' = 'pdf'
): Promise<Blob> {
  const headers = await getAuthHeaders(null);
  const response = await fetch(getApiUrl(`/api/scans/${scanId}/export?format=${format}`), {
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Perform CWE Top 25 scan
 */
export async function performCWETop25Scan(targetUrl: string): Promise<{
  success: boolean;
  target_url: string;
  total_checked: number;
  vulnerabilities_found: number;
  results: Array<{
    rank: number;
    cwe_id: string;
    name: string;
    score: number;
    severity: string;
    description: string;
    impact: string;
    detected: boolean;
    evidence: string | null;
    recommendation: string | null;
    platforms: string[];
  }>;
}> {
  return apiRequest('/api/scans/cwe-top-25', {
    method: 'POST',
    body: JSON.stringify({ target_url: targetUrl }),
  });
}

/**
 * Perform NIST SP 800-171 compliance scan
 */
export async function performNISTSP800171Scan(targetUrl: string): Promise<{
  success: boolean;
  target_url: string;
  total_controls: number;
  compliant_controls: number;
  non_compliant_controls: number;
  compliance_percentage: number;
  results: Array<{
    control_id: string;
    title: string;
    category: string;
    severity: string;
    description: string;
    compliant: boolean;
    requirements_met: number;
    requirements_total: number;
    compliance_percentage: number;
    evidence: string | null;
    recommendation: string | null;
    nist_control: string;
  }>;
}> {
  return apiRequest('/api/scans/nist-sp-800-171', {
    method: 'POST',
    body: JSON.stringify({ target_url: targetUrl }),
  });
}

// ==================== Mobile Scan APIs ====================

/**
 * Get all mobile scans for the current user
 */
export async function getMobileScans(): Promise<MobileScan[]> {
  return apiRequest<MobileScan[]>('/api/mobile-scans');
}

/**
 * Get a single mobile scan by ID
 */
export async function getMobileScan(id: number): Promise<MobileScan> {
  return apiRequest<MobileScan>(`/api/mobile-scans/${id}`);
}

/**
 * Get vulnerabilities for a mobile scan
 */
export async function getMobileScanVulnerabilities(scanId: number): Promise<MobileVulnerability[]> {
  return apiRequest<MobileVulnerability[]>(`/api/mobile-scans/${scanId}/vulnerabilities`);
}

/**
 * Create a new mobile scan with file upload
 */
export async function createMobileScan(
  file: File,
  platform: 'android' | 'ios'
): Promise<MobileScan> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('platform', platform);

  const headers = await getAuthHeaders(null); // null = no Content-Type header (browser will set it with boundary)
  
  const response = await fetch(getApiUrl('/api/mobile-scans'), {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a mobile scan
 */
export async function deleteMobileScan(id: number): Promise<void> {
  await apiRequest(`/api/mobile-scans/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Perform a trial mobile scan (without saving to database)
 */
export async function performTrialMobileScan(
  file: File,
  platform: 'android' | 'ios'
): Promise<{
  vulnerabilities: MobileVulnerability[];
  scan: {
    app_name: string;
    package_name: string | null;
    version: string | null;
    platform: string;
    severity_critical: number;
    severity_high: number;
    severity_medium: number;
    severity_low: number;
    severity_info: number;
  };
}> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('platform', platform);

  const headers = await getAuthHeaders(null);
  
  const response = await fetch(getApiUrl('/api/mobile-scans/trial'), {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Save a trial mobile scan to the database
 */
export async function saveTrialMobileScan(data: {
  app_name: string;
  package_name: string | null;
  version: string | null;
  platform: 'android' | 'ios';
  vulnerabilities: MobileVulnerability[];
}): Promise<MobileScan> {
  return apiRequest<MobileScan>('/api/mobile-scans/save-trial', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Export mobile scan report
 */
export async function exportMobileScanReport(
  scanId: number,
  format: 'pdf' | 'json' | 'csv' | 'html' = 'pdf'
): Promise<Blob> {
  const headers = await getAuthHeaders(null);
  const response = await fetch(getApiUrl(`/api/mobile-scans/${scanId}/export?format=${format}`), {
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.blob();
}

// ==================== Dashboard APIs ====================

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<{
  totalScans: number;
  completedScans: number;
  runningScans: number;
  totalVulnerabilities: number;
  criticalVulnerabilities: number;
}> {
  return apiRequest('/api/dashboard/stats');
}
