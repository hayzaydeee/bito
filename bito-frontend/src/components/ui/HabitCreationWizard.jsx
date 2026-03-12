import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedModal from "./AnimatedModal";
import { wizardStepVariants } from "../../utils/motion";
import {
  Cross2Icon,
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@radix-ui/react-icons";

/* ── Constants ── */

const EMOJI_CATEGORIES = {
  common: ["✅", "🔴", "🔵", "🟢", "⭐", "🎯", "💪", "🧠", "📚", "💧", "🏃", "🥗"],
  activity: ["🏋️", "🧘", "🚶", "🏃", "🚴", "🏊", "⚽", "🎮", "🎨", "🎵", "📝", "💻"],
  health: ["💧", "🥗", "🍎", "🥦", "💊", "😴", "🧠", "🧘", "❤️", "🦷", "🚭", "☀️"],
  productivity: ["📝", "⏰", "📅", "📚", "💼", "💻", "📱", "✉️", "📊", "🔍", "⚙️", "🏆"],
  mindfulness: ["🧘", "😌", "🌱", "🌈", "🌞", "🌙", "💭", "🧠", "❤️", "🙏", "✨", "💫"],
};

const COLOR_OPTIONS = [
  "#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316",
  "#e11d48", "#059669", "#dc2626",
];

const CATEGORIES = [
  { id: "health",       emoji: "💪", label: "Health" },
  { id: "fitness",      emoji: "🏃", label: "Fitness" },
  { id: "productivity", emoji: "🎯", label: "Productivity" },
  { id: "learning",     emoji: "📚", label: "Learning" },
  { id: "mindfulness",  emoji: "🧘", label: "Mindfulness" },
  { id: "social",       emoji: "🤝", label: "Social" },
  { id: "creative",     emoji: "🎨", label: "Creative" },
  { id: "other",        emoji: "✨", label: "Other" },
];

const STEP_COUNT = 4;
const STEP_LABELS = ["What", "When", "Style", "Go"];

const LS_COMPACT_KEY = "bito_wizard_compact";
const getCompactKey = (userId) => userId ? `${LS_COMPACT_KEY}_${userId}` : LS_COMPACT_KEY;

/* ── Sub-components ── */

/** Progress dots — matches onboarding pattern */
const ProgressDots = ({ step, total, labels }) => (
  <div className="flex items-center justify-center gap-3">
    {Array.from({ length: total }, (_, i) => (
      <div key={i} className="flex flex-col items-center gap-1">
        <div
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: i === step ? 24 : 8,
            backgroundColor: i <= step ? "var(--color-brand-500)" : "var(--color-surface-hover)",
          }}
        />
        <span
          className="text-[10px] font-spartan transition-colors duration-200"
          style={{ color: i <= step ? "var(--color-brand-500)" : "var(--color-text-tertiary)" }}
        >
          {labels[i]}
        </span>
      </div>
    ))}
  </div>
);

/* ── Main Wizard Component ── */

const HabitCreationWizard = ({ isOpen, onClose, onSave, userId }) => {
  const nameInputRef = useRef(null);

  /* ── Form state ── */
  const [formData, setFormData] = useState({
    name: "",
    icon: "✅",
    description: "",
    color: "#4f46e5",
    category: "other",
    frequency: "daily",
    weeklyTarget: 3,
    schedule: {
      days: [0, 1, 2, 3, 4, 5, 6],
      reminderTime: "",
      reminderEnabled: false,
    },
  });

  /* ── Wizard state ── */
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [emojiCategory, setEmojiCategory] = useState("common");
  const [errors, setErrors] = useState({});
  const [showDescription, setShowDescription] = useState(false);

  /* ── Compact mode (persisted per user) ── */
  const [compactMode, setCompactMode] = useState(() => {
    try {
      return localStorage.getItem(getCompactKey(userId)) === "true";
    } catch { return false; }
  });

  /* Reset on open */
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "", icon: "✅", description: "", color: "#4f46e5", category: "other",
        frequency: "daily", weeklyTarget: 3,
        schedule: { days: [0, 1, 2, 3, 4, 5, 6], reminderTime: "", reminderEnabled: false },
      });
      setStep(0);
      setErrors({});
      setShowDescription(false);
      setEmojiCategory("common");
    }
  }, [isOpen]);

  /* Auto-focus name input */
  useEffect(() => {
    if (isOpen && step === 0) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

  /* ── Navigation ── */
  const goNext = useCallback(() => {
    // Validate current step
    const newErrors = {};
    if (step === 0 && !formData.name.trim()) {
      newErrors.name = "Give your habit a name";
    }
    if (step === 1 && formData.frequency === "daily" && formData.schedule.days.length === 0) {
      newErrors.schedule = "Pick at least one day";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    if (step >= STEP_COUNT - 1) return;
    setDirection(1);
    setStep((s) => s + 1);
  }, [step, formData]);

  const goBack = useCallback(() => {
    if (step <= 0) { onClose(); return; }
    setDirection(-1);
    setStep((s) => s - 1);
  }, [step, onClose]);

  /* ── Submit ── */
  const handleSubmit = useCallback(() => {
    if (!formData.name.trim()) return;
    const scheduleData = {
      days: formData.frequency === "weekly" ? [0, 1, 2, 3, 4, 5, 6] : formData.schedule.days,
      reminderEnabled: formData.schedule.reminderEnabled,
      ...(formData.schedule.reminderEnabled && formData.schedule.reminderTime && {
        reminderTime: formData.schedule.reminderTime,
      }),
    };
    const submitData = {
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
      category: formData.category,
      description: formData.description,
      frequency: formData.frequency,
      ...(formData.frequency === "weekly" && { weeklyTarget: formData.weeklyTarget }),
      schedule: scheduleData,
    };
    onSave(submitData);
    onClose();
  }, [formData, onSave, onClose]);

  /* ── Day toggle ── */
  const toggleDay = (dayId) => {
    setFormData((prev) => {
      const newDays = prev.schedule.days.includes(dayId)
        ? prev.schedule.days.filter((d) => d !== dayId)
        : [...prev.schedule.days, dayId].sort();
      return { ...prev, schedule: { ...prev.schedule, days: newDays } };
    });
  };

  /* ── Compact mode toggle ── */
  const toggleCompact = () => {
    const next = !compactMode;
    setCompactMode(next);
    try { localStorage.setItem(getCompactKey(userId), String(next)); } catch {}
    if (!next) { setStep(0); }
  };

  /* ── Enter key on name field advances ── */
  const handleNameKeyDown = (e) => {
    if (e.key === "Enter" && formData.name.trim()) {
      e.preventDefault();
      goNext();
    }
  };

  if (!isOpen) return null;

  /* ────────────────────────────────────
     Step content renderers
     ──────────────────────────────────── */

  const renderStep0_What = () => (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-base font-bold text-[var(--color-text-primary)] font-dmSerif">
          What habit do you want to build?
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)] font-outfit mt-1">
          Name it, pick an icon, and you're off.
        </p>
      </div>

      {/* Name */}
      <div>
        <input
          ref={nameInputRef}
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          onKeyDown={handleNameKeyDown}
          className="w-full h-12 px-4 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] font-outfit placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand-500)] transition-colors text-sm"
          placeholder="e.g., Morning run, Read 20 pages, Meditate..."
        />
        {errors.name && <p className="text-xs text-red-500 mt-1 font-outfit">{errors.name}</p>}
      </div>

      {/* Emoji picker */}
      <div>
        <div className="flex gap-1 mb-2">
          {Object.keys(EMOJI_CATEGORIES).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`px-2 py-1 text-[11px] rounded-md transition-colors font-outfit ${
                emojiCategory === cat
                  ? "bg-[var(--color-brand-500)] text-white"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]"
              }`}
              onClick={() => setEmojiCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <div className="border border-[var(--color-border-primary)]/40 p-2 rounded-xl bg-[var(--color-surface-elevated)]">
          <div className="flex flex-wrap gap-1">
            {EMOJI_CATEGORIES[emojiCategory].map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`w-9 h-9 flex items-center justify-center text-lg hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors ${
                  formData.icon === emoji ? "bg-[var(--color-brand-100)] ring-1 ring-[var(--color-brand-500)]" : ""
                }`}
                onClick={() => setFormData((p) => ({ ...p, icon: emoji }))}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep1_When = () => (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-base font-bold text-[var(--color-text-primary)] font-dmSerif">
          When will you do it?
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)] font-outfit mt-1">
          Daily habits have a fixed schedule. Weekly habits let you choose any days to hit your target.
        </p>
      </div>

      {/* Frequency toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFormData((p) => ({ ...p, frequency: "daily" }))}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 font-outfit border ${
            formData.frequency !== "weekly"
              ? "bg-[var(--color-brand-500)] text-white border-[var(--color-brand-500)]"
              : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)]/40 hover:bg-[var(--color-surface-hover)]"
          }`}
        >
          <span className="block text-lg mb-0.5">📅</span>
          Daily
        </button>
        <button
          type="button"
          onClick={() => setFormData((p) => ({ ...p, frequency: "weekly" }))}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 font-outfit border ${
            formData.frequency === "weekly"
              ? "bg-[var(--color-brand-500)] text-white border-[var(--color-brand-500)]"
              : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)]/40 hover:bg-[var(--color-surface-hover)]"
          }`}
        >
          <span className="block text-lg mb-0.5">🎯</span>
          Weekly target
        </button>
      </div>

      {/* Frequency-specific controls */}
      {formData.frequency === "weekly" ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-[var(--color-surface-elevated)] rounded-xl">
            <span className="text-sm font-outfit text-[var(--color-text-primary)] flex-1">
              Complete on any
            </span>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, weeklyTarget: Math.max(1, p.weeklyTarget - 1) }))}
              className="w-8 h-8 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-bold text-sm flex items-center justify-center hover:bg-[var(--color-border-primary)] transition-colors"
            >−</button>
            <span className="text-xl font-bold font-spartan text-[var(--color-brand-500)] tabular-nums w-6 text-center">
              {formData.weeklyTarget}
            </span>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, weeklyTarget: Math.min(7, p.weeklyTarget + 1) }))}
              className="w-8 h-8 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-bold text-sm flex items-center justify-center hover:bg-[var(--color-border-primary)] transition-colors"
            >+</button>
            <span className="text-sm font-outfit text-[var(--color-text-primary)]">days/week</span>
          </div>
          <div className="flex items-start gap-2 px-1">
            <span className="text-sm mt-0.5">💡</span>
            <p className="text-[12px] text-[var(--color-text-tertiary)] font-outfit leading-relaxed">
              No fixed schedule — pick any {formData.weeklyTarget} day{formData.weeklyTarget > 1 ? "s" : ""} each week. 
              Your streak counts <strong>consecutive weeks</strong> where you meet the target.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit">
            Which days?
          </label>
          <div className="flex gap-1.5">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => {
              const dayId = index === 6 ? 0 : index + 1;
              const isSelected = formData.schedule.days.includes(dayId);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleDay(dayId)}
                  className={`flex-1 h-10 rounded-lg text-xs font-medium transition-all duration-200 font-outfit ${
                    isSelected
                      ? "bg-[var(--color-brand-500)] text-white"
                      : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {errors.schedule && <p className="text-xs text-red-500 mt-1 font-outfit">{errors.schedule}</p>}
        </div>
      )}
    </div>
  );

  const renderStep2_Style = () => (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-base font-bold text-[var(--color-text-primary)] font-dmSerif">
          Make it yours
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)] font-outfit mt-1">
          Pick a category and colour for your dashboard.
        </p>
      </div>

      {/* Preview */}
      <div className="flex items-center justify-center gap-3 py-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white shadow-sm"
          style={{ backgroundColor: formData.color }}
        >
          {formData.icon}
        </div>
        <span className="text-sm font-outfit font-medium text-[var(--color-text-primary)]">
          {formData.name || "Your habit"}
        </span>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
          Category
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFormData((p) => ({ ...p, category: cat.id }))}
              className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-xs font-outfit transition-all duration-200 border ${
                formData.category === cat.id
                  ? "bg-[var(--color-brand-500)]/10 border-[var(--color-brand-500)] text-[var(--color-brand-600)]"
                  : "bg-[var(--color-surface-elevated)] border-[var(--color-border-primary)]/40 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <span className="text-base">{cat.emoji}</span>
              <span className="font-medium">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
          Colour
        </label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                border: formData.color === color ? "2px solid white" : "1px solid var(--color-border-primary)",
                outline: formData.color === color ? `2px solid ${color}` : "none",
              }}
              onClick={() => setFormData((p) => ({ ...p, color }))}
            />
          ))}
        </div>
      </div>

      {/* Description (collapsed) */}
      {!showDescription ? (
        <button
          type="button"
          onClick={() => setShowDescription(true)}
          className="text-xs text-[var(--color-brand-500)] font-outfit hover:underline"
        >
          + Add a description
        </button>
      ) : (
        <div>
          <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
            className="w-full h-16 px-3 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] font-outfit placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand-500)] transition-colors resize-none text-sm"
            placeholder="Add a note or target for yourself..."
          />
        </div>
      )}
    </div>
  );

  const renderStep3_Confirm = () => {
    const scheduleLabel = formData.frequency === "weekly"
      ? `Any ${formData.weeklyTarget} day${formData.weeklyTarget > 1 ? "s" : ""}/week`
      : formData.schedule.days.length === 7
        ? "Every day"
        : formData.schedule.days
            .sort((a, b) => a - b)
            .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
            .join(", ");
    const categoryObj = CATEGORIES.find((c) => c.id === formData.category);

    return (
      <div className="space-y-4">
        <div className="text-center mb-2">
          <h3 className="text-base font-bold text-[var(--color-text-primary)] font-dmSerif">
            Looking good!
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] font-outfit mt-1">
            Confirm your habit and set up a reminder if you'd like.
          </p>
        </div>

        {/* Summary card */}
        <div
          className="p-4 rounded-xl border border-[var(--color-border-primary)] space-y-3"
          style={{ backgroundColor: "var(--color-surface-elevated)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl text-white"
              style={{ backgroundColor: formData.color }}
            >
              {formData.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-outfit font-semibold text-[var(--color-text-primary)] truncate">
                {formData.name}
              </p>
              <p className="text-xs font-outfit text-[var(--color-text-secondary)]">
                {scheduleLabel}
              </p>
            </div>
            <span
              className="text-[10px] font-outfit px-2 py-0.5 rounded-full border"
              style={{
                borderColor: "var(--color-border-primary)",
                color: "var(--color-text-secondary)",
              }}
            >
              {categoryObj?.emoji} {categoryObj?.label}
            </span>
          </div>
          {formData.description && (
            <p className="text-xs font-outfit text-[var(--color-text-tertiary)] pl-14">
              {formData.description}
            </p>
          )}
        </div>

        {/* Reminders */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-xl">
            <div>
              <span className="text-sm font-medium text-[var(--color-text-primary)] font-outfit">
                Reminder
              </span>
              <p className="text-[11px] text-[var(--color-text-tertiary)] font-outfit">
                Get a nudge at the right time
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.schedule.reminderEnabled}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    schedule: { ...p.schedule, reminderEnabled: e.target.checked },
                  }))
                }
                className="sr-only"
              />
              <div
                className={`w-11 h-6 rounded-full transition-colors ${
                  formData.schedule.reminderEnabled ? "bg-[var(--color-brand-500)]" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    formData.schedule.reminderEnabled ? "translate-x-5" : "translate-x-0"
                  } mt-0.5 ml-0.5`}
                />
              </div>
            </label>
          </div>
          {formData.schedule.reminderEnabled && (
            <input
              type="time"
              value={formData.schedule.reminderTime}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  schedule: { ...p.schedule, reminderTime: e.target.value },
                }))
              }
              className="w-full h-10 px-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] font-outfit focus:outline-none focus:border-[var(--color-brand-500)] transition-colors text-sm"
            />
          )}
        </div>
      </div>
    );
  };

  /* ── Compact (single-page) mode ── */
  const renderCompact = () => (
    <div className="space-y-5">
      {renderStep0_What()}
      <hr className="border-[var(--color-border-primary)]" />
      {renderStep1_When()}
      <hr className="border-[var(--color-border-primary)]" />
      {renderStep2_Style()}
      <hr className="border-[var(--color-border-primary)]" />
      {renderStep3_Confirm()}
    </div>
  );

  /* ── Stepped content with animation ── */
  const stepContent = [renderStep0_What, renderStep1_When, renderStep2_Style, renderStep3_Confirm];

  const isLastStep = step === STEP_COUNT - 1;
  const canProceed = step === 0 ? formData.name.trim().length > 0 : true;

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div
        className="bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--color-surface-primary)] px-5 pt-5 pb-3 border-b border-[var(--color-border-primary)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif">
              New Habit
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleCompact}
                className="text-[11px] font-outfit text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-500)] transition-colors"
              >
                {compactMode ? "Step mode" : "Quick mode"}
              </button>
              <button
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                onClick={onClose}
              >
                <Cross2Icon />
              </button>
            </div>
          </div>
          {!compactMode && <ProgressDots step={step} total={STEP_COUNT} labels={STEP_LABELS} />}
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          {compactMode ? (
            renderCompact()
          ) : (
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={wizardStepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {stepContent[step]()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--color-surface-primary)] px-5 py-4 border-t border-[var(--color-border-primary)]">
          {compactMode ? (
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 h-10 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] rounded-xl transition-all duration-200 font-outfit font-medium text-sm"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 h-10 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] disabled:opacity-40 text-white rounded-xl transition-all duration-200 font-outfit font-semibold flex items-center justify-center gap-2 text-sm"
                onClick={handleSubmit}
                disabled={!formData.name.trim()}
              >
                <CheckIcon className="w-4 h-4" />
                Create
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                className="h-10 px-4 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] rounded-xl transition-all duration-200 font-outfit font-medium text-sm flex items-center gap-1.5"
                onClick={goBack}
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                {step === 0 ? "Cancel" : "Back"}
              </button>
              <button
                type="button"
                className="flex-1 h-10 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] disabled:opacity-40 text-white rounded-xl transition-all duration-200 font-outfit font-semibold flex items-center justify-center gap-2 text-sm"
                onClick={isLastStep ? handleSubmit : goNext}
                disabled={!canProceed}
              >
                {isLastStep ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Create Habit
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </AnimatedModal>
  );
};

export default HabitCreationWizard;
