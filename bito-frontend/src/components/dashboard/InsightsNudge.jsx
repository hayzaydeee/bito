import React, { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { useInsights } from "../../globalHooks/useInsights";

/* ─── Progress bar for seedling / sprouting tiers ─── */
const TierProgress = ({ entryCount, thresholds, tier }) => {
  if (!thresholds || tier === "growing") return null;

  const target =
    tier === "seedling" ? thresholds.sprouting : thresholds.growing;
  const pct = Math.min(100, Math.round((entryCount / target) * 100));
  const remaining = Math.max(0, target - entryCount);
  const label =
    tier === "seedling"
      ? `Track ${remaining} more ${remaining === 1 ? "entry" : "entries"} to unlock deeper insights`
      : `${remaining} more ${remaining === 1 ? "entry" : "entries"} until full analytics`;

  return (
    <div className="mt-3 relative z-10">
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[10px] font-spartan font-medium uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          {tier === "seedling" ? "🌱 Getting started" : "🌿 Building momentum"}
        </span>
        <span
          className="text-[10px] font-spartan"
          style={{ color: "var(--color-text-muted)" }}
        >
          {entryCount}/{target}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(99,102,241,0.1)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, var(--color-brand-400), var(--color-brand-500, #7c3aed))",
          }}
        />
      </div>
      <p
        className="text-[10px] font-spartan mt-1"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </p>
    </div>
  );
};

/* ─── AI-powered insight card (Phase 12) ─── */
const InsightsNudge = memo(({ habits, entries }) => {
  const {
    insights,
    summary,
    isLoading,
    llmUsed,
    refresh,
    tier,
    entryCount,
    thresholds,
  } = useInsights();

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

      {/* Tier progress */}
      <TierProgress entryCount={entryCount} thresholds={thresholds} tier={tier} />

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
              className="text-xs font-spartan hover:underline transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              · powered by OpenAI
            </span>
          )}
          {tier === "sprouting" && (
            <span
              className="text-[10px] font-spartan font-medium px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(34,197,94,0.12)",
                color: "var(--color-success)",
              }}
            >
              Early insights
            </span>
          )}
          <Link
            to="/app/analytics"
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
