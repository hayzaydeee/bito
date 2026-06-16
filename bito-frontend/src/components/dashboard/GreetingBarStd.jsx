import React, { useMemo, memo } from "react";

/* ─────────────────────────────────────────────
   GreetingBar — DRILL masthead (two editorial voices)
   · daybook  → serif almanac masthead + kicker + date
   · control  → mono status console bar
   ───────────────────────────────────────────── */
const GreetingBar = memo(({ userName = "User", firstName, variant = "daybook" }) => {
  const displayFirstName = useMemo(() => {
    if (firstName) return firstName;
    if (!userName || userName === "User") return "User";
    return userName.split(" ")[0];
  }, [userName, firstName]);

  const { greeting, weekday, longDate, numericDate } = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const g = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    return {
      greeting: g,
      weekday: now.toLocaleDateString("en-US", { weekday: "long" }),
      longDate: now.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
      numericDate: now.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" }).replace("/", "."),
    };
  }, []);

  /* ── Mission Control — status console bar ── */
  if (variant === "control") {
    return (
      <div className="std-card flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[var(--signal)] flex-shrink-0 animate-pulse" />
          <span className="std-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-2)] truncate">
            Status · {displayFirstName}
          </span>
        </div>
        <span className="std-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-3)] flex-shrink-0 tabular-nums">
          {weekday.slice(0, 3)} {numericDate}
        </span>
      </div>
    );
  }

  /* ── Daybook — serif almanac masthead ── */
  return (
    <div>
      <p className="std-kicker">{weekday} · The Daybook</p>
      <div className="flex items-baseline justify-between gap-4 flex-wrap mt-1.5">
        <h1 className="std-display text-2xl sm:text-3xl font-bold text-[var(--ink)]">
          {greeting}, {displayFirstName}
        </h1>
        <span className="std-mono text-[11px] uppercase tracking-wider text-[var(--ink-3)]">
          {longDate}
        </span>
      </div>
    </div>
  );
});

GreetingBar.displayName = "GreetingBar";
export default GreetingBar;
