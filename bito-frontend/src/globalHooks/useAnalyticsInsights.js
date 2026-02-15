import { useState, useEffect, useCallback, useRef } from 'react';
import { insightsAPI } from '../services/api';

/**
 * Hook for the comprehensive analytics insights report.
 *
 * Returns structured sections (summary, patterns, trends, correlations,
 * recommendations) plus loading / error state.
 *
 * Re-fetches when `range` changes. Call `refresh()` to force-regenerate.
 */
export function useAnalyticsInsights(range = '30d') {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevRange = useRef(range);

  const fetchReport = useCallback(async (r, forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await insightsAPI.getAnalyticsReport(r, forceRefresh);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load analytics report');
      }
    } catch (err) {
      console.warn('Analytics insights fetch failed:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount and when range changes
  useEffect(() => {
    fetchReport(range, false);
    prevRange.current = range;
  }, [range, fetchReport]);

  const refresh = useCallback(() => fetchReport(range, true), [range, fetchReport]);

  return {
    sections: data?.sections ?? null,
    ruleInsights: data?.ruleInsights ?? [],
    llmUsed: data?.llmUsed ?? false,
    generatedAt: data?.generatedAt ?? null,
    cached: data?.cached ?? false,
    isLoading,
    error,
    refresh,
  };
}
