import React, { memo, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Leaf, TrendUp } from "@phosphor-icons/react";
import { useInsights } from "../../globalHooks/useInsights";

/* ─────────────────────────────────────────────
   InsightsNudge — DRILL editorial insight card
   · daybook  → "The Margin" serif pull-quote
   · control  → "Signal" mono telemetry note
   ───────────────────────────────────────────── */

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
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="std-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
          {tier === "seedling" ? (
            <span className="inline-flex items-center gap-1">
              <Leaf size={12} weight="duotone" /> Getting started
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <TrendUp size={12} weight="duotone" style={{ color: "var(--signal)" }} /> Building momentum
            </span>
          )}
        </span>
        <span className="std-mono text-[10px] tabular-nums text-[var(--ink-3)]">
          {entryCount}/{target}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-[var(--line-2)]">
        <div
          className="h-full rounded-full bg-[var(--signal)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="std-mono text-[10px] mt-1 text-[var(--ink-3)]">{label}</p>
    </div>
  );
};

/* ─── AI-powered insight card ─── */
const InsightsNudge = memo(({ habits, entries, variant = "daybook" }) => {
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
  const isControl = variant === "control";

  /* ── Auto-refresh when entries change (debounced) ── */
  const entriesSnapshotRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const snapshot = JSON.stringify(
      Object.entries(entries || {}).reduce((acc, [hId, dates]) => {
        const todayKey = new Date().toISOString().split("T")[0];
        const entry = dates?.[todayKey];
        if (entry) acc[hId] = entry.completed;
        return acc;
      }, {})
    );

    if (entriesSnapshotRef.current === null) {
      entriesSnapshotRef.current = snapshot;
      return;
    }

    if (snapshot !== entriesSnapshotRef.current) {
      entriesSnapshotRef.current = snapshot;
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => refresh(), 2000);
    }

    return () => clearTimeout(debounceRef.current);
  }, [entries, refresh]);

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

  const displayText = summary || fallbackText;
  if (!displayText) return null;

  return (
    <div className="std-card relative overflow-hidden p-4 border-l-2 border-l-[var(--signal)]">
      <p className="std-kicker mb-2">{isControl ? "Signal" : "The Margin"}</p>

      <p
        className={`${isControl ? "std-mono text-[12px] leading-relaxed" : "std-display text-[15px] leading-relaxed italic"} text-[var(--ink-2)]`}
      >
        {displayText}
      </p>

      {/* Tier progress */}
      <TierProgress entryCount={entryCount} thresholds={thresholds} tier={tier} />

      {/* Footer */}
      {!isLoading && insights.length > 0 && (
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={refresh}
            className="std-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
          >
            Refresh
          </button>
          {llmUsed && (
            <span className="std-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
              · via OpenAI
            </span>
          )}
          {tier === "sprouting" && (
            <span className="std-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-[var(--r-tag)] border border-[var(--line-2)] text-[var(--ink-3)]">
              Early insights
            </span>
          )}
          <Link
            to="/app/analytics"
            className="std-mono text-[10px] uppercase tracking-wider ml-auto text-[var(--signal)] hover:underline transition-colors"
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
