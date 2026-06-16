import React, { useMemo, memo } from "react";

/* ─── Compact one-line greeting ─── */
const GreetingBar = memo(({ userName = "User", firstName }) => {
  const displayFirstName = useMemo(() => {
    if (firstName) return firstName;
    if (!userName || userName === "User") return "User";
    return userName.split(" ")[0];
  }, [userName, firstName]);

  const { greeting, dateStr } = useMemo(() => {
    const h = new Date().getHours();
    const g = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    const d = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    return { greeting: g, dateStr: d };
  }, []);

  return (
    <div className="flex items-baseline justify-between gap-4 flex-wrap">
      <h1
        className="text-xl sm:text-2xl font-garamond font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        {greeting}, {displayFirstName}
      </h1>
      <span
        className="text-sm font-spartan"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {dateStr}
      </span>
    </div>
  );
});

GreetingBar.displayName = "GreetingBar";
export default GreetingBar;
