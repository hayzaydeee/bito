import React, { memo, useState, useEffect } from "react";

/**
 * StreakCelebration — Phase 13
 *
 * Renders a brief celebration overlay when a streak milestone
 * (7, 14, 21, 30, 50, 100 days) is hit. Uses CSS-only confetti burst
 * defined in index.css (.streak-celebrate).
 *
 * Usage: <StreakCelebration streak={currentStreak} habitName="..." />
 */

const MILESTONES = [7, 14, 21, 30, 50, 100];

const StreakCelebration = memo(({ streak, habitName }) => {
  const [show, setShow] = useState(false);
  const [milestone, setMilestone] = useState(null);

  useEffect(() => {
    if (MILESTONES.includes(streak)) {
      setMilestone(streak);
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [streak]);

  if (!show || !milestone) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{ animation: "fadeIn 200ms ease-out both" }}
    >
      <div
        className="streak-celebrate px-6 py-4 rounded-2xl text-center pointer-events-auto"
        style={{
          backgroundColor: "var(--color-surface-primary)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          animation: "checkBounce 350ms cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <div className="text-3xl mb-1">🔥</div>
        <h3
          className="text-lg font-garamond font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {milestone}-day streak!
        </h3>
        {habitName && (
          <p
            className="text-sm font-spartan mt-0.5"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {habitName}
          </p>
        )}
      </div>
    </div>
  );
});

StreakCelebration.displayName = "StreakCelebration";
export default StreakCelebration;
