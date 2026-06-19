import React, { memo, useMemo, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Leaf, TrendUp, HandsClapping, Heart, Fire, Star, Sparkle } from "@phosphor-icons/react";
import { useInsights } from "../../globalHooks/useInsights";
import { encouragementAPI } from "../../services/api";

const ReactionIcon = ({ reaction }) => {
  switch (reaction) {
    case '👏': return <HandsClapping size={14} weight="duotone" />;
    case '🔥': return <Fire size={14} weight="duotone" />;
    case '💪': return <TrendUp size={14} weight="duotone" />;
    case '⭐': return <Star size={14} weight="duotone" />;
    case '🎉': return <Sparkle size={14} weight="duotone" />;
    default: return <Heart size={14} weight="duotone" />;
  }
};

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
          {tier === "seedling" ? (
            <span className="inline-flex items-center gap-1">
              <Leaf size={12} weight="duotone" className="text-green-400" /> Getting started
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <TrendUp size={12} weight="duotone" style={{ color: "var(--color-brand-400)" }} /> Building momentum
            </span>
          )}
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

  /* ── Auto-refresh when entries change (debounced) ── */
  const entriesSnapshotRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    // Build a lightweight snapshot of completion states
    const snapshot = JSON.stringify(
      Object.entries(entries || {}).reduce((acc, [hId, dates]) => {
        const todayKey = new Date().toISOString().split("T")[0];
        const entry = dates?.[todayKey];
        if (entry) acc[hId] = entry.completed;
        return acc;
      }, {})
    );

    // Skip initial mount (useInsights already fetches once)
    if (entriesSnapshotRef.current === null) {
      entriesSnapshotRef.current = snapshot;
      return;
    }

    // Only refresh if something actually changed
    if (snapshot !== entriesSnapshotRef.current) {
      entriesSnapshotRef.current = snapshot;
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => refresh(), 2000);
    }

    return () => clearTimeout(debounceRef.current);
  }, [entries, refresh]);

  /* ── Fetch Encouragements ── */
  const [recentEncouragements, setRecentEncouragements] = useState([]);
  useEffect(() => {
    const fetchEncouragements = async () => {
      try {
        const res = await encouragementAPI.getReceivedEncouragements();
        if (res.success && res.data) {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          // Wither effect: only keep encouragements from the last 24 hours
          const recent = res.data.filter(e => new Date(e.createdAt) > oneDayAgo);
          setRecentEncouragements(recent);
        }
      } catch (err) {
        console.error("Failed to fetch encouragements", err);
      }
    };
    fetchEncouragements();
  }, []);

  /* ── Carousel State ── */
  const [activeSlide, setActiveSlide] = useState(0);
  const totalSlides = recentEncouragements.length + 1; // N encouragements + 1 AI Insight

  useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % totalSlides);
    }, 7000);
    return () => clearInterval(interval);
  }, [totalSlides]);

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
  const aiDisplayText = summary || fallbackText;

  if (!aiDisplayText && recentEncouragements.length === 0) return null;

  const renderSlide = () => {
    if (activeSlide < recentEncouragements.length) {
      const enc = recentEncouragements[activeSlide];
      return (
        <div key={`enc-${activeSlide}`} className="animate-float-in relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center">
              <ReactionIcon reaction={enc.reaction} />
            </span>
            <p className="text-[10px] font-spartan font-medium uppercase tracking-wider text-[var(--color-text-primary)]">
              {enc.fromUser?.name || "A team member"} cheered you on!
            </p>
          </div>
          <p className="text-sm font-spartan leading-relaxed text-[var(--color-text-secondary)] italic">
            "{enc.message}"
          </p>
          {enc.habit?.name && (
            <p className="text-[10px] font-spartan mt-3" style={{ color: "var(--color-text-muted)" }}>
              Re: {enc.habit.name}
            </p>
          )}
        </div>
      );
    }

    return (
      <div key={`insight-${activeSlide}`} className="animate-float-in relative z-10">
        <p
          className="text-sm font-spartan leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {aiDisplayText}
        </p>

        {/* Tier progress */}
        <TierProgress entryCount={entryCount} thresholds={thresholds} tier={tier} />

        {/* Footer */}
        {!isLoading && insights.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
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
  };

  return (
    <div
      className="glass-insight relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 min-h-[120px] flex flex-col justify-center"
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

      {renderSlide()}

      {/* Navigation Dots */}
      {totalSlides > 1 && (
        <div className="absolute top-4 right-4 flex gap-1.5 z-20">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                activeSlide === i ? "bg-indigo-400 w-3" : "bg-indigo-400/20 hover:bg-indigo-400/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
});

InsightsNudge.displayName = "InsightsNudge";
export default InsightsNudge;
