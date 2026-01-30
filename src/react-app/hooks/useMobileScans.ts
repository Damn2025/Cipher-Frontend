import { useState, useEffect } from 'react';
import { MobileScan, MobileVulnerability } from '@/shared/types';
import { getMobileScans, getMobileScan, getMobileScanVulnerabilities } from '@/react-app/lib/api';

export function useMobileScans() {
  const [scans, setScans] = useState<MobileScan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScans = async () => {
    try {
      const data = await getMobileScans();
      setScans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch mobile scans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
    const interval = setInterval(fetchScans, 5000);
    return () => clearInterval(interval);
  }, []);

  return { scans, loading, refetch: fetchScans };
}

export function useMobileScan(id: string | undefined) {
  const [scan, setScan] = useState<MobileScan | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<MobileVulnerability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchScanData = async () => {
      try {
        const scanId = parseInt(id, 10);
        if (isNaN(scanId)) throw new Error('Invalid mobile scan ID');

        const [scanData, vulnData] = await Promise.all([
          getMobileScan(scanId),
          getMobileScanVulnerabilities(scanId),
        ]);

        setScan(scanData);
        setVulnerabilities(Array.isArray(vulnData) ? vulnData : []);
      } catch (error) {
        console.error('Failed to fetch mobile scan:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScanData();
    const interval = setInterval(fetchScanData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  return { scan, vulnerabilities, loading };
}
