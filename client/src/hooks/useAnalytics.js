import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService.js';

export const useAnalytics = (timeRange = '30d') => {
  const [kpis, setKpis] = useState(null);
  const [volume, setVolume] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [kpisData, volumeData, distData, perfData] = await Promise.all([
        analyticsService.getKpis().catch(() => null),
        analyticsService.getVolume(timeRange).catch(() => []),
        analyticsService.getDistribution().catch(() => null),
        analyticsService.getPerformance().catch(() => [])
      ]);

      setKpis(kpisData);
      setVolume(Array.isArray(volumeData) ? volumeData : volumeData?.trend || []);
      setDistribution(distData);
      setPerformance(Array.isArray(perfData) ? perfData : perfData?.staff || []);
      setError(null);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to load analytics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    kpis,
    volume,
    distribution,
    performance,
    loading,
    error,
    refetch: fetchAnalytics
  };
};
