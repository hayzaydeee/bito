import { useState, useEffect, useCallback, useRef } from 'react';
import { insightsAPI } from '../services/api';

/**
 * Hook to fetch and manage AI insights from the backend.
 *
 * Returns the full insights payload (insights[], summary, llmUsed)
 * plus loading / error state and a refresh function.
 *
 * Auto-fetches once on mount, then relies on cache. Call `refresh()`
 * to force a fresh generation.
 */
export function useInsights() {
  const [data, setData] = useState(null);       // { insights, summary, llmUsed, llmAvailable, generatedAt }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  const fetchInsights = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await insightsAPI.getInsights(forceRefresh);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load insights');
      }
    } catch (err) {
      console.warn('Insights fetch failed (non-blocking):', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch once on mount
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchInsights(false);
  }, [fetchInsights]);

  const refresh = useCallback(() => fetchInsights(true), [fetchInsights]);

  const dismiss = useCallback(async (insightType, habitId) => {
    try {
      await insightsAPI.dismissInsight(insightType, habitId);
      // Remove the dismissed insight from local state immediately
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          insights: prev.insights.filter(i =>
            !(i.type === insightType && (habitId ? String(i.habitId) === String(habitId) : true))
          ),
        };
      });
    } catch (err) {
      console.warn('Dismiss failed:', err.message);
    }
  }, []);

  return {
    insights: data?.insights ?? [],
    summary: data?.summary ?? null,
    llmUsed: data?.llmUsed ?? false,
    llmAvailable: data?.llmAvailable ?? false,
    generatedAt: data?.generatedAt ?? null,
    tier: data?.tier ?? null,
    entryCount: data?.entryCount ?? null,
    thresholds: data?.thresholds ?? null,
    isLoading,
    error,
    refresh,
    dismiss,
  };
}
