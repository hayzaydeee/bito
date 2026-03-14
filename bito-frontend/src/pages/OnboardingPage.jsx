import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  TargetIcon,
} from "@radix-ui/react-icons";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { userAPI } from "../services/api";
import useMotionSafe from "../hooks/useMotionSafe";
import AnimatedList from "../components/ui/AnimatedList";
import {
  listItemVariants,
  wizardStepVariants,
  celebrationVariants,
  confettiParticle,
  buttonHover,
  buttonTap,
  backdropVariants,
  springs,
} from "../utils/motion";

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
  const { showError, showSuccess } = useNotifications();
  const { getVariants, prefersReduced } = useMotionSafe();
  const shouldAnimate = typeof motion !== "undefined" && !prefersReduced;
  const [step, setStep] = useState(0); // 0=welcome, 1=goals, 2=time, 3=done
  const [direction, setDirection] = useState(1); // 1=forward, -1=back
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [preferredTimes, setPreferredTimes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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
    setSubmitError("");
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setSubmitError("");
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleComplete = async () => {
    setSubmitError("");
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
      showSuccess("Welcome aboard. Your setup has been saved.");
      navigate("/app/dashboard", { state: { fromOnboarding: true } });
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      const message = "We couldn't save your setup yet. Please try again.";
      setSubmitError(message);
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitError("");
    setIsSubmitting(true);
    try {
      await userAPI.updateProfile({ onboardingComplete: true });
      updateUser({ onboardingComplete: true });
    } catch {
      updateUser({ onboardingComplete: true });
      showError("Setup skipped due to a temporary save issue.");
    } finally {
      setIsSubmitting(false);
    }
    navigate("/app/dashboard", { state: { fromOnboarding: true } });
  };

  const confettiAngles = [
    -1.7,
    -1.35,
    -1.1,
    -0.85,
    -0.6,
    -0.35,
    -0.1,
    0.15,
    0.4,
    0.65,
    0.9,
    1.15,
  ];

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
        <motion.div
          className="flex justify-center mb-8"
          initial={shouldAnimate ? { opacity: 0, scale: 0.9, y: 10 } : false}
          animate={shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ ...springs.soft, delay: 0.05 }}
        >
          <motion.div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "var(--color-brand-600)" }}
            whileHover={shouldAnimate ? { rotate: -4, scale: 1.03 } : {}}
            whileTap={shouldAnimate ? buttonTap : {}}
          >
            <TargetIcon className="w-8 h-8 text-white" />
          </motion.div>
        </motion.div>

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

        <motion.button
          onClick={goNext}
          className="btn btn-primary btn-lg group mx-auto"
          whileHover={prefersReduced ? {} : buttonHover}
          whileTap={prefersReduced ? {} : buttonTap}
        >
          Let's go
          <ArrowRightIcon className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        <motion.button
          onClick={handleSkip}
          disabled={isSubmitting}
          className="block mx-auto mt-4 text-sm font-spartan transition-colors"
          style={{ color: "var(--color-text-tertiary)" }}
          whileTap={prefersReduced ? {} : buttonTap}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
        >
          Skip setup — I'll explore on my own
        </motion.button>
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

        <AnimatedList className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
          {GOAL_OPTIONS.map((goal, i) => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <motion.div key={goal.id} variants={getVariants(listItemVariants)} custom={i}>
              <motion.button
                onClick={() => toggleGoal(goal.id)}
                className="text-left rounded-xl border p-4 transition-all duration-150 w-full"
                whileHover={prefersReduced ? {} : { y: -2, scale: isSelected ? 1.02 : 1.01 }}
                whileTap={prefersReduced ? {} : buttonTap}
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
                    <motion.div
                      className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                      initial={prefersReduced ? false : { scale: 0.4, opacity: 0 }}
                      animate={prefersReduced ? {} : { scale: 1, opacity: 1 }}
                      transition={{ ...springs.bouncy, duration: 0.3 }}
                    >
                      <CheckIcon className="w-3 h-3 text-white" />
                    </motion.div>
                  </div>
                )}
              </motion.button>
              </motion.div>
            );
          })}
        </AnimatedList>

        <div className="flex items-center justify-between">
          <motion.button
            onClick={goBack}
            className="flex items-center gap-2 text-sm font-spartan transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            whileTap={prefersReduced ? {} : buttonTap}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </motion.button>
          <motion.button
            onClick={goNext}
            disabled={selectedGoals.length === 0}
            className="btn btn-primary btn-md group"
            whileHover={selectedGoals.length === 0 || prefersReduced ? {} : buttonHover}
            whileTap={selectedGoals.length === 0 || prefersReduced ? {} : buttonTap}
            style={{
              opacity: selectedGoals.length === 0 ? 0.4 : 1,
              cursor: selectedGoals.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Continue
            <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </motion.button>
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

        <AnimatedList className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {TIME_OPTIONS.map((opt, i) => {
            const isSelected = preferredTimes.includes(opt.id);
            return (
              <motion.button
                key={opt.id}
                variants={getVariants(listItemVariants)}
                custom={i}
                onClick={() => toggleTime(opt.id)}
                className="text-center rounded-xl border p-5 transition-all duration-150"
                whileHover={prefersReduced ? {} : { y: -2, scale: isSelected ? 1.02 : 1.01 }}
                whileTap={prefersReduced ? {} : buttonTap}
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
                  <motion.div
                    className="mt-2 mx-auto w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                    initial={prefersReduced ? false : { scale: 0.4, opacity: 0 }}
                    animate={prefersReduced ? {} : { scale: 1, opacity: 1 }}
                    transition={{ ...springs.bouncy, duration: 0.3 }}
                  >
                    <CheckIcon className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </AnimatedList>

        <p
          className="text-center text-xs font-spartan mb-8"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Pick all that apply — or skip to continue
        </p>

        <div className="flex items-center justify-between">
          <motion.button
            onClick={goBack}
            className="flex items-center gap-2 text-sm font-spartan transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            whileTap={prefersReduced ? {} : buttonTap}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--color-text-primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--color-text-secondary)")
            }
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </motion.button>
          <motion.button
            onClick={goNext}
            className="btn btn-primary btn-md group"
            whileHover={prefersReduced ? {} : buttonHover}
            whileTap={prefersReduced ? {} : buttonTap}
          >
            Continue
            <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
      </div>
    ),

    /* ── Step 3: Done ── */
    3: (
      <div className="text-center max-w-lg mx-auto relative">
        {/* Celebration emoji */}
        <AnimatePresence>
          {step === 3 && !prefersReduced && (
            <motion.div
              key="confetti"
              className="absolute inset-0 pointer-events-none"
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {confettiAngles.map((angle, i) => (
                <motion.span
                  key={`${angle}-${i}`}
                  className="absolute top-8 left-1/2 w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: i % 2 === 0 ? "var(--color-brand-500)" : "#F59E0B",
                  }}
                  variants={confettiParticle(angle, 90 + i * 3)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          className="text-6xl mb-6"
          variants={getVariants(celebrationVariants)}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          🎉
        </motion.div>

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
          <AnimatedList className="space-y-2.5" stagger={0.05}>
            {[
              "Tap + to create a habit — daily schedules or flexible weekly targets.",
              "Check Analytics to see your patterns after a few days.",
              "Invite friends to a group for shared accountability.",
            ].map((tip, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-2.5"
                variants={getVariants(listItemVariants)}
                custom={i}
              >
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
              </motion.div>
            ))}
          </AnimatedList>
        </div>

        <AnimatePresence>
          {submitError && (
            <motion.div
              className="rounded-lg border px-4 py-3 mb-5 text-sm font-spartan"
              style={{
                borderColor: "rgba(239, 68, 68, 0.35)",
                color: "#f87171",
                backgroundColor: "rgba(239, 68, 68, 0.08)",
              }}
              initial={prefersReduced ? false : { opacity: 0, y: 10 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              exit={prefersReduced ? {} : { opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {submitError}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleComplete}
          disabled={isSubmitting}
          className="btn btn-primary btn-lg group mx-auto"
          whileHover={isSubmitting || prefersReduced ? {} : buttonHover}
          whileTap={isSubmitting || prefersReduced ? {} : buttonTap}
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
        </motion.button>
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
            <motion.div
              key={s}
              className="h-1.5 rounded-full"
              animate={{
                width: s === step ? 24 : 8,
                scale: s === step ? 1.05 : 1,
                backgroundColor:
                  s <= step ? "var(--color-brand-500)" : "var(--color-surface-hover)",
                boxShadow:
                  s === step
                    ? "0 0 10px rgba(79, 70, 229, 0.35)"
                    : "0 0 0 rgba(0,0,0,0)",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          ))}
        </div>

        <div className="w-20" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-12 relative">
        <AnimatePresence>
          {isSubmitting && (
            <motion.div
              className="absolute inset-0 z-10"
              style={{ backgroundColor: "rgba(15, 23, 42, 0.28)", backdropFilter: "blur(1px)" }}
              variants={getVariants(backdropVariants)}
              initial="initial"
              animate="animate"
              exit="exit"
            />
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={getVariants(wizardStepVariants)}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full max-w-3xl min-h-[460px] flex items-center"
          >
            {stepContent[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingPage;
