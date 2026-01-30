import { getApiUrl, getAuthHeaders } from '@/react-app/lib/api';

export type SavedTrialScan = { scanId: string; scanType: 'web' | 'mobile' };

export async function saveTrialScan(): Promise<SavedTrialScan | null> {
  try {
    const pendingTrialScan = localStorage.getItem('pendingTrialScan');
    if (!pendingTrialScan) {
      return null;
    }

    const trialScanData = JSON.parse(pendingTrialScan);
    const scanType = trialScanData.scanType as 'web' | 'mobile';

    const headers = await getAuthHeaders('application/json');
    const headersObj: Record<string, string> = typeof headers === 'object' && !Array.isArray(headers) && !(headers instanceof Headers)
      ? (headers as Record<string, string>)
      : {};

    if (!headersObj.Authorization) return null;

    let response: Response;

    if (scanType === 'web') {
      response = await fetch(getApiUrl('/api/scans/save-trial'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          scan: trialScanData.scan,
          vulnerabilities: trialScanData.vulnerabilities,
        }),
      });
    } else if (scanType === 'mobile') {
      response = await fetch(getApiUrl('/api/mobile-scans/save-trial'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          scan: trialScanData.scan,
          vulnerabilities: trialScanData.vulnerabilities,
        }),
      });
    } else {
      return null;
    }

    if (response.ok) {
      const data = await response.json();
      const scanId = data?.scan?.id;
      localStorage.removeItem('pendingTrialScan');
      if (scanId) {
        return { scanId, scanType };
      }
    }

    return null;
  } catch (err) {
    console.error('Failed to save trial scan:', err);
    return null;
  }
}
