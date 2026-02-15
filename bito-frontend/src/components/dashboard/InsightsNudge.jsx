import React, { memo, useState, useMemo, useCallback } from "react";
import { useInsights } from "../../globalHooks/useInsights";

/* ─── AI-powered insight card (Phase 12) ─── */
const InsightsNudge = memo(({ habits, entries }) => {
  const { insights, summary, isLoading, llmUsed, refresh, dismiss } =
    useInsights();

  /* ── Carousel state ── */
  const [index, setIndex] = useState(0);

  /* ── Client-side fallback while backend loads ── */
  const clientInsight = useMemo(() => {
    if (!habits?.length) return null;
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Quick streak check
    let bestStreak = 0;
    let bestHabit = null;
    habits.forEach((h) => {
      let streak = 0;
      const d = new Date(today);
      while (streak <= 365) {
        const ds = d.toISOString().split("T")[0];
        const entry = entries[h._id]?.[ds];
        if (entry && entry.completed) {
          streak++;
          d.setDate(d.getDate() - 1);
        } else break;
      }
      if (streak > bestStreak) {
        bestStreak = streak;
        bestHabit = h;
      }
    });

    if (bestStreak >= 7)
      return {
        emoji: "🔥",
        text: `You've done "${bestHabit.name}" ${bestStreak} days in a row — that's consistency!`,
      };

    let totalToday = 0;
    let completedToday = 0;
    habits.forEach((h) => {
      if (!h.isActive) return;
      totalToday++;
      if (entries[h._id]?.[todayStr]?.completed) completedToday++;
    });

    if (totalToday > 0 && completedToday === totalToday)
      return { emoji: "🎯", text: "All habits checked off today — nice work!" };
    if (totalToday > 0 && completedToday === 0)
      return {
        emoji: "💡",
        text: "Start with your easiest habit — one tap gets the ball rolling.",
      };
    if (completedToday > 0 && completedToday < totalToday) {
      const r = totalToday - completedToday;
      return {
        emoji: "⚡",
        text: `${r} habit${r === 1 ? "" : "s"} left today — you're already on a roll.`,
      };
    }
    return null;
  }, [habits, entries]);

  /* ── Which insight list to render? ── */
  const hasBackendInsights = !isLoading && insights.length > 0;
  const visibleInsights = hasBackendInsights
    ? insights.map((i) => ({ emoji: i.icon, text: i.body, type: i.type, habitId: i.habitId }))
    : clientInsight
      ? [clientInsight]
      : [];

  const safeIndex = visibleInsights.length > 0 ? index % visibleInsights.length : 0;
  const current = visibleInsights[safeIndex];

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % Math.max(visibleInsights.length, 1));
  }, [visibleInsights.length]);

  const handleDismiss = useCallback(() => {
    if (current?.type) dismiss(current.type, current.habitId);
    next();
  }, [current, dismiss, next]);

  if (!current && !summary) return null;

  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{
        background: "rgba(99,102,241,0.03)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "rgba(99,102,241,0.12)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* LLM summary */}
      {summary && (
        <p
          className="text-sm font-spartan leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {summary}
        </p>
      )}

      {/* Insight carousel */}
      {current && (
        <div className="flex items-start gap-3 group">
          <span className="text-lg flex-shrink-0 mt-0.5">{current.emoji}</span>
          <p
            className="text-sm font-spartan leading-relaxed flex-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {current.text}
          </p>

          {/* Controls (only when multiple insights) */}
          {visibleInsights.length > 1 && (
            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
              <span
                className="text-xs tabular-nums"
                style={{ color: "var(--color-text-muted)" }}
              >
                {safeIndex + 1}/{visibleInsights.length}
              </span>
              <button
                onClick={next}
                className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Next insight"
                style={{ color: "var(--color-text-muted)" }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              {hasBackendInsights && (
                <button
                  onClick={handleDismiss}
                  className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Dismiss insight"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Refresh link */}
      {hasBackendInsights && (
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="text-xs font-spartan hover:underline transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            Refresh insights
          </button>
          {llmUsed && (
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              · AI-enhanced
            </span>
          )}
        </div>
      )}
    </div>
  );
});

InsightsNudge.displayName = "InsightsNudge";
export default InsightsNudge;
