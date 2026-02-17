import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  TargetIcon,
} from "@radix-ui/react-icons";
import { useAuth } from "../contexts/AuthContext";
import { userAPI } from "../services/api";

/* ─────────────────────────────────────────────
   Phase 4 — Onboarding Interactive Playground
   ───────────────────────────────────────────── */

const GOAL_OPTIONS = [
  {
    id: "health",
    emoji: "💪",
    label: "Health & fitness",
    description: "Exercise, hydration, sleep",
    category: "health",
    color: "#22C55E",
    habits: [
      { name: "Drink 8 glasses of water", icon: "💧", target: { value: 8, unit: "glasses" } },
      { name: "Exercise for 30 min", icon: "🏃", frequency: "weekly", weeklyTarget: 5, target: { value: 30, unit: "minutes" } },
      { name: "Sleep by 11 PM", icon: "😴", target: { value: 1, unit: "times" } },
    ],
  },
  {
    id: "productivity",
    emoji: "🎯",
    label: "Productivity",
    description: "Focus, planning, deep work",
    category: "productivity",
    color: "#6366F1",
    habits: [
      { name: "Plan 3 daily priorities", icon: "📝", target: { value: 3, unit: "times" } },
      { name: "Deep work session", icon: "🧠", target: { value: 1, unit: "times" } },
      { name: "No phone first hour", icon: "📵", target: { value: 1, unit: "times" } },
    ],
  },
  {
    id: "mindfulness",
    emoji: "🧘",
    label: "Mindfulness",
    description: "Meditation, journaling, gratitude",
    category: "mindfulness",
    color: "#8B5CF6",
    habits: [
      { name: "Morning meditation", icon: "🧘", target: { value: 10, unit: "minutes" } },
      { name: "Gratitude journal", icon: "🙏", target: { value: 1, unit: "times" } },
      { name: "Digital sunset", icon: "🌅", target: { value: 1, unit: "times" } },
    ],
  },
  {
    id: "learning",
    emoji: "📚",
    label: "Learning",
    description: "Reading, courses, practice",
    category: "learning",
    color: "#3B82F6",
    habits: [
      { name: "Read for 20 minutes", icon: "📖", frequency: "weekly", weeklyTarget: 5, target: { value: 20, unit: "minutes" } },
      { name: "Learn something new", icon: "💡", target: { value: 1, unit: "times" } },
      { name: "Review notes", icon: "📝", target: { value: 1, unit: "times" } },
    ],
  },
  {
    id: "social",
    emoji: "🤝",
    label: "Relationships",
    description: "Connection, kindness, outreach",
    category: "social",
    color: "#F59E0B",
    habits: [
      { name: "Reach out to a friend", icon: "📱", frequency: "weekly", weeklyTarget: 3, target: { value: 1, unit: "times" } },
      { name: "Random act of kindness", icon: "💛", frequency: "weekly", weeklyTarget: 2, target: { value: 1, unit: "times" } },
      { name: "Quality time (no screens)", icon: "🤝", target: { value: 30, unit: "minutes" } },
    ],
  },
  {
    id: "creative",
    emoji: "✨",
    label: "Creativity",
    description: "Writing, art, side projects",
    category: "creative",
    color: "#EC4899",
    habits: [
      { name: "Creative practice", icon: "🎨", frequency: "weekly", weeklyTarget: 4, target: { value: 1, unit: "times" } },
      { name: "Capture an idea", icon: "💡", target: { value: 1, unit: "times" } },
      { name: "Work on side project", icon: "🛠️", frequency: "weekly", weeklyTarget: 3, target: { value: 1, unit: "times" } },
    ],
  },
];

const TIME_OPTIONS = [
  { id: "morning", emoji: "🌅", label: "Morning", time: "6 AM – 12 PM", description: "Start the day strong" },
  { id: "afternoon", emoji: "☀️", label: "Afternoon", time: "12 – 5 PM", description: "Midday momentum" },
  { id: "evening", emoji: "🌙", label: "Evening", time: "5 – 10 PM", description: "Wind down right" },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, updateUser, isAuthenticated, isLoading } = useAuth();
  const [step, setStep] = useState(0); // 0=welcome, 1=goals, 2=time, 3=done
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [preferredTimes, setPreferredTimes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // If already onboarded, redirect to dashboard
  useEffect(() => {
    if (user?.onboardingComplete) {
      navigate("/app");
    }
  }, [user, navigate]);

  const firstName = user?.firstName || user?.name?.split(" ")[0] || "there";

  const toggleGoal = (goalId) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  const toggleTime = (timeId) => {
    setPreferredTimes((prev) =>
      prev.includes(timeId) ? prev.filter((t) => t !== timeId) : [...prev, timeId]
    );
  };

  const goNext = () => {
    setAnimatingOut(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setAnimatingOut(false);
    }, 200);
  };

  const goBack = () => {
    setAnimatingOut(true);
    setTimeout(() => {
      setStep((s) => s - 1);
      setAnimatingOut(false);
    }, 200);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Save onboarding preferences (no habits created — wizard handles that)
      await userAPI.updateProfile({
        onboardingComplete: true,
        onboardingData: {
          goals: selectedGoals,
          preferredTimes,
        },
      });
      updateUser({ onboardingComplete: true });
      navigate("/app/dashboard");
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      updateUser({ onboardingComplete: true });
      navigate("/app/dashboard");
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await userAPI.updateProfile({ onboardingComplete: true });
      updateUser({ onboardingComplete: true });
    } catch {
      updateUser({ onboardingComplete: true });
    }
    navigate("/app/dashboard");
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        <div
          className="w-10 h-10 border-3 rounded-full animate-spin"
          style={{
            borderColor: "var(--color-border-primary)",
            borderTopColor: "var(--color-brand-500)",
          }}
        />
      </div>
    );
  }

  /* ─── Step content ─── */
  const stepContent = {
    /* ── Step 0: Welcome ── */
    0: (
      <div className="text-center max-w-lg mx-auto">
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "var(--color-brand-600)" }}
          >
            <TargetIcon className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1
          className="heading-display font-garamond mb-4"
          style={{ color: "var(--color-text-primary)", fontSize: "2.5rem", lineHeight: 1.15 }}
        >
          Welcome, {firstName}!
        </h1>
        <p
          className="text-lg font-spartan leading-relaxed mb-10"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Let's set things up so bito works for{" "}
          <span style={{ color: "var(--color-text-primary)" }}>you</span>. It
          only takes a minute.
        </p>

        <button
          onClick={goNext}
          className="btn btn-primary btn-lg group mx-auto"
        >
          Let's go
          <ArrowRightIcon className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={handleSkip}
          className="block mx-auto mt-4 text-sm font-spartan transition-colors"
          style={{ color: "var(--color-text-tertiary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
        >
          Skip setup — I'll explore on my own
        </button>
      </div>
    ),

    /* ── Step 1: Pick goals ── */
    1: (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2
            className="heading-lg font-garamond mb-3"
            style={{ color: "var(--color-text-primary)" }}
          >
            What are you working on?
          </h2>
          <p
            className="text-base font-spartan"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Pick one or more — this helps us personalise your experience.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
          {GOAL_OPTIONS.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className="text-left rounded-xl border p-4 transition-all duration-150"
                style={{
                  backgroundColor: isSelected
                    ? "var(--color-brand-600)"
                    : "var(--color-surface-primary)",
                  borderColor: isSelected
                    ? "var(--color-brand-500)"
                    : "var(--color-border-primary)",
                  transform: isSelected ? "scale(1.02)" : "scale(1)",
                }}
              >
                <div className="text-2xl mb-2">{goal.emoji}</div>
                <h4
                  className="text-sm font-spartan font-semibold mb-0.5"
                  style={{
                    color: isSelected ? "#fff" : "var(--color-text-primary)",
                  }}
                >
                  {goal.label}
                </h4>
                <p
                  className="text-xs font-spartan"
                  style={{
                    color: isSelected
                      ? "rgba(255,255,255,0.7)"
                      : "var(--color-text-tertiary)",
                  }}
                >
                  {goal.description}
                </p>
                {isSelected && (
                  <div className="mt-2 flex justify-end">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm font-spartan transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={goNext}
            disabled={selectedGoals.length === 0}
            className="btn btn-primary btn-md group"
            style={{
              opacity: selectedGoals.length === 0 ? 0.4 : 1,
              cursor: selectedGoals.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Continue
            <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    ),

    /* ── Step 2: Time of day ── */
    2: (
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <h2
            className="heading-lg font-garamond mb-3"
            style={{ color: "var(--color-text-primary)" }}
          >
            When do you build habits?
          </h2>
          <p
            className="text-base font-spartan"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Pick when you're most active — we'll set reminders accordingly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {TIME_OPTIONS.map((opt) => {
            const isSelected = preferredTimes.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleTime(opt.id)}
                className="text-center rounded-xl border p-5 transition-all duration-150"
                style={{
                  backgroundColor: isSelected
                    ? "var(--color-brand-600)"
                    : "var(--color-surface-primary)",
                  borderColor: isSelected
                    ? "var(--color-brand-500)"
                    : "var(--color-border-primary)",
                  transform: isSelected ? "scale(1.02)" : "scale(1)",
                }}
              >
                <span className="text-3xl block mb-2">{opt.emoji}</span>
                <h4
                  className="text-sm font-spartan font-semibold mb-0.5"
                  style={{
                    color: isSelected ? "#fff" : "var(--color-text-primary)",
                  }}
                >
                  {opt.label}
                </h4>
                <p
                  className="text-xs font-spartan"
                  style={{
                    color: isSelected
                      ? "rgba(255,255,255,0.6)"
                      : "var(--color-text-tertiary)",
                  }}
                >
                  {opt.time}
                </p>
                {isSelected && (
                  <div className="mt-2 mx-auto w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckIcon className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <p
          className="text-center text-xs font-spartan mb-8"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Pick all that apply — or skip to continue
        </p>

        <div className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm font-spartan transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--color-text-primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--color-text-secondary)")
            }
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={goNext}
            className="btn btn-primary btn-md group"
          >
            Continue
            <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    ),

    /* ── Step 3: Done ── */
    3: (
      <div className="text-center max-w-lg mx-auto">
        {/* Celebration emoji */}
        <div className="text-6xl mb-6">🎉</div>

        <h2
          className="heading-lg font-garamond mb-4"
          style={{ color: "var(--color-text-primary)" }}
        >
          You're all set!
        </h2>
        <p
          className="text-base font-spartan leading-relaxed mb-3"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Head to your dashboard and create your first habit — the wizard will walk you through it step by step.
        </p>

        {/* Quick tips */}
        <div
          className="rounded-xl border p-5 text-left mb-8 mt-6"
          style={{
            backgroundColor: "var(--color-surface-primary)",
            borderColor: "var(--color-border-primary)",
          }}
        >
          <h4
            className="text-sm font-spartan font-semibold mb-3"
            style={{ color: "var(--color-text-primary)" }}
          >
            Quick tips
          </h4>
          <div className="space-y-2.5">
            {[
              "Tap + to create a habit — daily schedules or flexible weekly targets.",
              "Check Analytics to see your patterns after a few days.",
              "Invite friends to a group for shared accountability.",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: "var(--color-brand-600)" }}
                >
                  <CheckIcon className="w-3 h-3 text-white" />
                </div>
                <p
                  className="text-sm font-spartan"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleComplete}
          disabled={isSubmitting}
          className="btn btn-primary btn-lg group mx-auto"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Setting up…
            </span>
          ) : (
            <>
              Go to my dashboard
              <ArrowRightIcon className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    ),
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--color-brand-600)" }}
          >
            <TargetIcon className="w-5 h-5 text-white" />
          </div>
          <span
            className="text-lg font-bold font-garamond"
            style={{ color: "var(--color-text-primary)" }}
          >
            bito
          </span>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: s === step ? 24 : 8,
                backgroundColor:
                  s <= step ? "var(--color-brand-500)" : "var(--color-surface-hover)",
              }}
            />
          ))}
        </div>

        <div className="w-20" />
      </div>

      {/* Content */}
      <div
        className="flex-1 flex items-center justify-center px-6 pb-12"
        style={{
          opacity: animatingOut ? 0 : 1,
          transform: animatingOut ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 200ms ease, transform 200ms ease",
        }}
      >
        {stepContent[step]}
      </div>
    </div>
  );
};

export default OnboardingPage;
