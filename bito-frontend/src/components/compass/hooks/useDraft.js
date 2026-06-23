import { useState, useEffect, useRef, useCallback } from 'react';

const DRAFT_KEY = 'compass_draft';
const DRAFT_VERSION = 1;
const STALE_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEBOUNCE_MS = 500;

/**
 * useDraft — persists Compass creation state (goal text + clarification)
 * to localStorage between sessions.
 *
 * Rules:
 * - Writes are debounced 500ms to avoid thrashing storage on every keystroke.
 * - Reads check version + age; stale (>24h) or mismatched-version drafts are discarded.
 * - clearDraft() removes the key unconditionally.
 * - If clarification.goalText doesn't match the current goalText, clarification
 *   is considered stale and is stripped on next save.
 *
 * Returns:
 *   draft    — { goalText, clarification } | null — restored from storage on mount
 *   saveDraft(data) — debounced write
 *   clearDraft()    — immediate remove
 */
const useDraft = () => {
  // Read once on mount — intentionally not reactive to storage events
  const [draft] = useState(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.version !== DRAFT_VERSION) return null;
      if (!parsed?.savedAt || Date.now() - parsed.savedAt > STALE_MS) return null;
      return {
        goalText: parsed.goalText || '',
        clarification: parsed.clarification || null,
      };
    } catch {
      return null;
    }
  });

  const debounceTimer = useRef(null);

  const saveDraft = useCallback(({ goalText, clarification }) => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      try {
        // If clarification was for a different goal text, strip it
        const safeClarification =
          clarification && clarification.goalText === goalText
            ? clarification
            : null;

        const payload = {
          version: DRAFT_VERSION,
          savedAt: Date.now(),
          goalText: goalText || '',
          clarification: safeClarification,
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      } catch {
        // Storage quota exceeded — silently fail, draft is non-critical
      }
    }, DEBOUNCE_MS);
  }, []);

  const clearDraft = useCallback(() => {
    clearTimeout(debounceTimer.current);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // noop
    }
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => clearTimeout(debounceTimer.current);
  }, []);

  return { draft, saveDraft, clearDraft };
};

export default useDraft;
