import { useState, useEffect } from 'react';
import { Scan, Vulnerability } from '@/shared/types';
import { getScans, getScan, getScanVulnerabilities, getDashboardStats } from '@/react-app/lib/api';

export function useScans() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = async () => {
    try {
      // Don't set loading to true on subsequent fetches to avoid flickering
      const data = await getScans();
      setScans(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scans');
      console.error('Fetch scans error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();

    const interval = setInterval(() => {
      fetchScans();
    }, 2000); // Poll every 2 seconds to catch status changes quickly

    return () => clearInterval(interval);
  }, []);

  return { scans, loading, error, refetch: fetchScans };
}

export function useScan(id: string | undefined) {
  const [scan, setScan] = useState<Scan | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScan = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const scanId = parseInt(id, 10);
      if (isNaN(scanId)) throw new Error('Invalid scan ID');

      const [scanData, vulnData] = await Promise.all([
        getScan(scanId),
        getScanVulnerabilities(scanId),
      ]);

      setScan(scanData);
      setVulnerabilities(vulnData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scan');
      console.error('Fetch scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScan();
    const interval = setInterval(() => {
      fetchScan();
    }, scan?.status === 'running' ? 2000 : 5000); // Poll every 2s if running, 5s if completed
    return () => clearInterval(interval);
  }, [id, scan?.status]);

  return { scan, vulnerabilities, loading, error, refetch: fetchScan };
}

export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalScans: 0,
    completedScans: 0,
    runningScans: 0,
    totalVulnerabilities: 0,
    criticalVulnerabilities: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      // Handle case where data might be undefined or missing fields
      if (data) {
        setStats({
          totalScans: data.totalScans || 0,
          completedScans: data.completedScans || 0,
          runningScans: data.runningScans || 0,
          totalVulnerabilities: data.totalVulnerabilities || 0,
          criticalVulnerabilities: data.criticalVulnerabilities || 0,
        });
      }
      setLoading(false);
    } catch (err) {
      console.error('Fetch stats error:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, refetch: fetchStats };
}