import React, { memo } from "react";

/* ─── AI-style passive insight card ─── */
const InsightsNudge = memo(({ habits, entries }) => {
  /* Generate a simple insight from the data we have.
     Phase 12 will add a real backend endpoint; for now
     we do lightweight client-side heuristics. */

  const insight = (() => {
    if (!habits.length) return null;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // --- Streak insight ---
    // Find the habit with the longest active streak
    let bestStreak = 0;
    let bestHabit = null;
    habits.forEach((h) => {
      let streak = 0;
      const d = new Date(today);
      while (true) {
        const ds = d.toISOString().split("T")[0];
        const entry = entries[h._id]?.[ds];
        if (entry && entry.completed) {
          streak++;
          d.setDate(d.getDate() - 1);
        } else {
          break;
        }
        if (streak > 365) break;
      }
      if (streak > bestStreak) {
        bestStreak = streak;
        bestHabit = h;
      }
    });

    if (bestStreak >= 7) {
      return {
        emoji: "🔥",
        text: `You've done "${bestHabit.name}" ${bestStreak} days in a row — that's consistency!`,
      };
    }

    // --- Completion rate insight ---
    let totalToday = 0;
    let completedToday = 0;
    habits.forEach((h) => {
      if (!h.isActive) return;
      totalToday++;
      const entry = entries[h._id]?.[todayStr];
      if (entry && entry.completed) completedToday++;
    });

    if (totalToday > 0 && completedToday === totalToday) {
      return {
        emoji: "🎯",
        text: "All habits checked off today — nice work!",
      };
    }

    if (totalToday > 0 && completedToday === 0) {
      return {
        emoji: "💡",
        text: "Start with your easiest habit — one tap gets the ball rolling.",
      };
    }

    if (totalToday > 0 && completedToday > 0 && completedToday < totalToday) {
      const remaining = totalToday - completedToday;
      return {
        emoji: "⚡",
        text: `${remaining} habit${remaining === 1 ? "" : "s"} left today — you're already on a roll.`,
      };
    }

    return null;
  })();

  if (!insight) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-xl border px-4 py-3"
      style={{
        backgroundColor: "rgba(99,102,241,0.04)",
        borderColor: "rgba(99,102,241,0.15)",
      }}
    >
      <span className="text-lg flex-shrink-0 mt-0.5">{insight.emoji}</span>
      <p
        className="text-sm font-spartan leading-relaxed"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {insight.text}
      </p>
    </div>
  );
});

InsightsNudge.displayName = "InsightsNudge";
export default InsightsNudge;
