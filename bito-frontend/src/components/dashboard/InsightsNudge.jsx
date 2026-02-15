import React, { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { useInsights } from "../../globalHooks/useInsights";

/* ─── AI-powered insight card (Phase 12) ─── */
const InsightsNudge = memo(({ habits, entries }) => {
  const { insights, summary, isLoading, llmUsed, refresh } = useInsights();

  /* ── Client-side fallback while backend loads ── */
  const fallbackText = useMemo(() => {
    if (!habits?.length) return null;
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    let bestStreak = 0;
    let bestHabit = null;
    habits.forEach((h) => {
      let streak = 0;
      const d = new Date(today);
      while (streak <= 365) {
        const ds = d.toISOString().split("T")[0];
        if (entries[h._id]?.[ds]?.completed) {
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
      return `You've done "${bestHabit.name}" ${bestStreak} days in a row — that's consistency!`;

    let totalToday = 0;
    let completedToday = 0;
    habits.forEach((h) => {
      if (!h.isActive) return;
      totalToday++;
      if (entries[h._id]?.[todayStr]?.completed) completedToday++;
    });

    if (totalToday > 0 && completedToday === totalToday)
      return "All habits checked off today — nice work!";
    if (totalToday > 0 && completedToday === 0)
      return "Start with your easiest habit — one tap gets the ball rolling.";
    if (completedToday > 0 && completedToday < totalToday) {
      const r = totalToday - completedToday;
      return `${r} habit${r === 1 ? "" : "s"} left today — you're already on a roll.`;
    }
    return null;
  }, [habits, entries]);

  /* ── Pick the best text to display ── */
  const displayText = summary || fallbackText;

  if (!displayText) return null;

  return (
    <div
      className="glass-insight relative overflow-hidden rounded-2xl border p-4 transition-all duration-300"
      style={{
        background:
          "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 50%, rgba(99,102,241,0.04) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderColor: "rgba(99,102,241,0.18)",
        boxShadow:
          "0 2px 12px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Sheen layer */}
      <div
        className="glass-sheen pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.07) 55%, transparent 60%)",
          backgroundSize: "200% 100%",
          backgroundPosition: "200% 0",
          transition: "background-position 600ms ease",
        }}
      />

      <p
        className="text-sm font-spartan leading-relaxed relative z-10"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {displayText}
      </p>

      {/* Footer */}
      {!isLoading && insights.length > 0 && (
        <div className="flex items-center gap-2 mt-2 relative z-10">
          <button
            onClick={refresh}
            className="text-xs font-spartan hover:underline transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            Refresh
          </button>
          {llmUsed && (
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              · AI-enhanced
            </span>
          )}
          <Link
            to="/analytics"
            className="text-xs font-spartan ml-auto hover:underline transition-colors"
            style={{ color: "var(--color-brand-400)" }}
          >
            Full analysis →
          </Link>
        </div>
      )}
    </div>
  );
});

InsightsNudge.displayName = "InsightsNudge";
export default InsightsNudge;
