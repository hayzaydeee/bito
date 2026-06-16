import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedModal from "./AnimatedModal";
import { wizardStepVariants } from "../../utils/motion";
import {
  Cross2Icon,
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  TrashIcon,
  ArchiveIcon,
} from "@radix-ui/react-icons";
import { Barbell, Target, BookOpen, Brain, Users, Palette, Sparkle } from "@phosphor-icons/react";
import IconPicker from "../shared/IconPicker";
import HabitIcon from "../shared/HabitIcon";

/* ─── Constants ─── */

const COLOR_OPTIONS = [
  "#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316",
  "#e11d48", "#059669", "#dc2626",
];

const CATEGORIES = [
  { id: "health",       Icon: Barbell,   label: "Health" },
  { id: "fitness",      Icon: Barbell,   label: "Fitness" },
  { id: "productivity", Icon: Target,    label: "Productivity" },
  { id: "learning",     Icon: BookOpen,  label: "Learning" },
  { id: "mindfulness",  Icon: Brain,     label: "Mindfulness" },
  { id: "social",       Icon: Users,     label: "Social" },
  { id: "creative",     Icon: Palette,   label: "Creative" },
  { id: "other",        Icon: Sparkle,   label: "Other" },
];

const STEP_COUNT = 4;
const STEP_LABELS = ["What", "When", "Style", "Go"];

const LS_COMPACT_KEY = "bito_wizard_compact";
const getCompactKey = (userId) => (userId ? `${LS_COMPACT_KEY}_${userId}` : LS_COMPACT_KEY);

/* ─── Shared styles ─── */

const inputCls =
  "w-full h-11 px-3.5 bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--r-btn)] text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[var(--signal)] transition-colors text-sm";

const fieldLabelCls = "std-kicker block mb-1.5";
const errorCls = "std-mono text-[10px] uppercase tracking-wide text-[var(--rose)] mt-1";

/* ─── Shared sub-components ─── */

const ProgressDots = ({ step, total, labels }) => (
  <div className="flex items-center justify-center gap-3">
    {Array.from({ length: total }, (_, i) => (
      <div key={i} className="flex flex-col items-center gap-1">
        <div
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: i === step ? 24 : 8,
            backgroundColor: i <= step ? "var(--signal)" : "var(--line-2)",
          }}
        />
        <span
          className="std-mono text-[9px] uppercase tracking-wide transition-colors duration-200"
          style={{ color: i <= step ? "var(--signal)" : "var(--ink-3)" }}
        >
          {labels[i]}
        </span>
      </div>
    ))}
  </div>
);

/* segmented toggle button helper */
const segStyle = (active) => ({
  backgroundColor: active ? "var(--signal)" : "var(--surface-2)",
  color: active ? "var(--signal-ink)" : "var(--ink-2)",
  borderColor: active ? "var(--signal)" : "var(--line)",
});

/* ─── Shared: Frequency section (used in both modes) ─── */

const FrequencySection = ({ formData, setFormData, errors }) => {
  const toggleDay = (dayId) => {
    setFormData((prev) => {
      const newDays = prev.schedule.days.includes(dayId)
        ? prev.schedule.days.filter((d) => d !== dayId)
        : [...prev.schedule.days, dayId].sort();
      return { ...prev, schedule: { ...prev.schedule, days: newDays } };
    });
  };

  return (
    <div className="space-y-3">
      {/* Frequency toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFormData((p) => ({ ...p, frequency: "daily" }))}
          className="flex-1 py-2.5 rounded-[var(--r-btn)] text-sm font-medium transition-all duration-200 border"
          style={segStyle(formData.frequency !== "weekly")}
        >
          Daily
        </button>
        <button
          type="button"
          onClick={() => setFormData((p) => ({ ...p, frequency: "weekly" }))}
          className="flex-1 py-2.5 rounded-[var(--r-btn)] text-sm font-medium transition-all duration-200 border"
          style={segStyle(formData.frequency === "weekly")}
        >
          Weekly target
        </button>
      </div>

      {formData.frequency === "weekly" ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 std-card">
            <span className="text-sm text-[var(--ink)] flex-1">Complete on any</span>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, weeklyTarget: Math.max(1, p.weeklyTarget - 1) }))}
              className="w-8 h-8 rounded-[var(--r-btn)] bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink)] font-bold text-sm flex items-center justify-center hover:border-[var(--signal)] transition-colors"
            >
              −
            </button>
            <span className="std-num text-xl font-bold text-[var(--signal)] tabular-nums w-6 text-center">
              {formData.weeklyTarget}
            </span>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, weeklyTarget: Math.min(7, p.weeklyTarget + 1) }))}
              className="w-8 h-8 rounded-[var(--r-btn)] bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink)] font-bold text-sm flex items-center justify-center hover:border-[var(--signal)] transition-colors"
            >
              +
            </button>
            <span className="text-sm text-[var(--ink)]">days/week</span>
          </div>
          <p className="std-mono text-[10px] text-[var(--ink-3)] px-1 leading-relaxed">
            No fixed schedule — pick any {formData.weeklyTarget} day{formData.weeklyTarget > 1 ? "s" : ""} each week.
            Your streak counts consecutive weeks where you meet the target.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <label className={fieldLabelCls}>Which days?</label>
          <div className="flex gap-1.5">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => {
              const dayId = index === 6 ? 0 : index + 1;
              const isSelected = formData.schedule.days.includes(dayId);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleDay(dayId)}
                  className="flex-1 h-10 rounded-[var(--r-btn)] std-mono text-xs uppercase transition-all duration-200 border"
                  style={segStyle(isSelected)}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {errors?.schedule && <p className={errorCls}>{errors.schedule}</p>}
        </div>
      )}
    </div>
  );
};

/* ─── Shared: Style section (color + category) ─── */

const StyleSection = ({ formData, setFormData }) => (
  <div className="space-y-4">
    {/* Category */}
    <div>
      <label className={fieldLabelCls}>Category</label>
      <div className="grid grid-cols-4 gap-1.5">
        {CATEGORIES.map(({ id, Icon, label }) => {
          const active = formData.category === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFormData((p) => ({ ...p, category: id }))}
              className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-[var(--r-btn)] transition-all duration-200 border"
              style={{
                backgroundColor: active ? "var(--signal-2)" : "var(--surface-2)",
                borderColor: active ? "var(--signal)" : "var(--line)",
                color: active ? "var(--signal)" : "var(--ink-2)",
              }}
            >
              <Icon size={15} weight="duotone" />
              <span className="std-mono text-[9px] uppercase tracking-wide">{label}</span>
            </button>
          );
        })}
      </div>
    </div>

    {/* Color */}
    <div>
      <label className={fieldLabelCls}>Colour</label>
      <div className="flex flex-wrap gap-2">
        {COLOR_OPTIONS.map((color) => {
          const active = formData.color === color;
          return (
            <button
              key={color}
              type="button"
              className="w-8 h-8 rounded-[var(--r-btn)] transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                outline: active ? `2px solid var(--signal)` : "none",
                outlineOffset: "2px",
                border: "1px solid var(--line)",
              }}
              onClick={() => setFormData((p) => ({ ...p, color }))}
            />
          );
        })}
      </div>
    </div>
  </div>
);

/* ─── Shared: Reminder toggle ─── */

const Switch = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    <div
      className="w-11 h-6 rounded-full transition-colors"
      style={{ backgroundColor: checked ? "var(--signal)" : "var(--line-2)" }}
    >
      <div
        className={`w-5 h-5 rounded-full shadow transform transition-transform mt-0.5 ml-0.5 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
        style={{ backgroundColor: checked ? "var(--signal-ink)" : "var(--surface)" }}
      />
    </div>
  </label>
);

const ReminderToggle = ({ formData, setFormData }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between px-4 py-3 std-card">
      <div>
        <span className="text-sm font-medium text-[var(--ink)]">Reminder</span>
        <p className="std-mono text-[10px] text-[var(--ink-3)] mt-0.5">Get a nudge at the right time</p>
      </div>
      <Switch
        checked={formData.schedule.reminderEnabled}
        onChange={(e) =>
          setFormData((p) => ({ ...p, schedule: { ...p.schedule, reminderEnabled: e.target.checked } }))
        }
      />
    </div>
    {formData.schedule.reminderEnabled && (
      <input
        type="time"
        value={formData.schedule.reminderTime}
        onChange={(e) =>
          setFormData((p) => ({ ...p, schedule: { ...p.schedule, reminderTime: e.target.value } }))
        }
        className={inputCls}
      />
    )}
  </div>
);

/* ═══════════════════════════════════════
   ADD MODE — 4-step wizard (Step ⇄ Quick)
   ═══════════════════════════════════════ */

const AddMode = ({ isOpen, onClose, onSave, userId }) => {
  const nameInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "", icon: "Target", description: "", color: "#4f46e5", category: "other",
    frequency: "daily", weeklyTarget: 3,
    schedule: { days: [0, 1, 2, 3, 4, 5, 6], reminderTime: "", reminderEnabled: false },
  });

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [errors, setErrors] = useState({});
  const [showDescription, setShowDescription] = useState(false);

  const [compactMode, setCompactMode] = useState(() => {
    try { return localStorage.getItem(getCompactKey(userId)) === "true"; }
    catch { return false; }
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "", icon: "Target", description: "", color: "#4f46e5", category: "other",
        frequency: "daily", weeklyTarget: 3,
        schedule: { days: [0, 1, 2, 3, 4, 5, 6], reminderTime: "", reminderEnabled: false },
      });
      setStep(0);
      setErrors({});
      setShowDescription(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && step === 0) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

  const goNext = useCallback(() => {
    const newErrors = {};
    if (step === 0 && !formData.name.trim()) newErrors.name = "Give your habit a name";
    if (step === 1 && formData.frequency === "daily" && formData.schedule.days.length === 0)
      newErrors.schedule = "Pick at least one day";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
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

  const handleSubmit = useCallback(() => {
    if (!formData.name.trim()) return;
    const scheduleData = {
      days: formData.frequency === "weekly" ? [0, 1, 2, 3, 4, 5, 6] : formData.schedule.days,
      reminderEnabled: formData.schedule.reminderEnabled,
      ...(formData.schedule.reminderEnabled && formData.schedule.reminderTime && {
        reminderTime: formData.schedule.reminderTime,
      }),
    };
    onSave({
      name: formData.name, icon: formData.icon, color: formData.color,
      category: formData.category, description: formData.description,
      frequency: formData.frequency,
      ...(formData.frequency === "weekly" && { weeklyTarget: formData.weeklyTarget }),
      schedule: scheduleData,
    });
    onClose();
  }, [formData, onSave, onClose]);

  const toggleCompact = () => {
    const next = !compactMode;
    setCompactMode(next);
    try { localStorage.setItem(getCompactKey(userId), String(next)); } catch {}
    if (!next) setStep(0);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === "Enter" && formData.name.trim()) { e.preventDefault(); goNext(); }
  };

  /* ── Step renderers ── */

  const StepHeading = ({ title, sub }) => (
    <div className="text-center mb-2">
      <p className="std-kicker">{`Step ${step + 1} of ${STEP_COUNT}`}</p>
      <h3 className="std-display text-xl font-bold text-[var(--ink)] mt-1">{title}</h3>
      <p className="text-[13px] text-[var(--ink-2)] mt-1 leading-relaxed">{sub}</p>
    </div>
  );

  const renderStep0 = () => (
    <div className="space-y-4">
      <StepHeading title="What habit do you want to build?" sub="Name it, pick an icon, and you're off." />
      <div>
        <input
          ref={nameInputRef}
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          onKeyDown={handleNameKeyDown}
          className={`${inputCls} h-12`}
          placeholder="e.g., Morning run, Read 20 pages, Meditate..."
        />
        {errors.name && <p className={errorCls}>{errors.name}</p>}
      </div>
      <IconPicker value={formData.icon} onChange={(icon) => setFormData((p) => ({ ...p, icon }))} />
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <StepHeading
        title="When will you do it?"
        sub="Daily habits have a fixed schedule. Weekly habits let you choose any days to hit your target."
      />
      <FrequencySection formData={formData} setFormData={setFormData} errors={errors} />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <StepHeading title="Make it yours" sub="Pick a category and colour for your dashboard." />
      {/* Preview */}
      <div className="flex items-center justify-center gap-3 py-2">
        <div
          className="w-12 h-12 rounded-[var(--r-card)] flex items-center justify-center shadow-sm"
          style={{ backgroundColor: formData.color }}
        >
          <HabitIcon icon={formData.icon} size={24} color="#fff" />
        </div>
        <span className="std-display text-base font-bold text-[var(--ink)]">
          {formData.name || "Your habit"}
        </span>
      </div>
      <StyleSection formData={formData} setFormData={setFormData} />
      {/* Description */}
      {!showDescription ? (
        <button
          type="button"
          onClick={() => setShowDescription(true)}
          className="std-mono text-[10px] uppercase tracking-wider text-[var(--signal)] hover:underline"
        >
          + Add a description
        </button>
      ) : (
        <div>
          <label className={fieldLabelCls}>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
            className={`${inputCls} h-16 py-2 resize-none`}
            placeholder="Add a note or target for yourself..."
          />
        </div>
      )}
    </div>
  );

  const renderStep3 = () => {
    const scheduleLabel =
      formData.frequency === "weekly"
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
        <StepHeading title="Looking good!" sub="Confirm your habit and set up a reminder if you'd like." />
        {/* Summary card */}
        <div className="std-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-[var(--r-card)] flex items-center justify-center"
              style={{ backgroundColor: formData.color }}
            >
              <HabitIcon icon={formData.icon} size={22} color="#fff" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="std-display text-[15px] font-bold text-[var(--ink)] truncate">{formData.name}</p>
              <p className="std-mono text-[10px] uppercase tracking-wide text-[var(--ink-3)] mt-0.5">{scheduleLabel}</p>
            </div>
            <span className="std-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-[var(--r-tag)] border border-[var(--line-2)] text-[var(--ink-3)]">
              {categoryObj?.label}
            </span>
          </div>
          {formData.description && (
            <p className="text-[13px] text-[var(--ink-2)] pl-14 leading-relaxed">{formData.description}</p>
          )}
        </div>
        <ReminderToggle formData={formData} setFormData={setFormData} />
      </div>
    );
  };

  const renderCompact = () => (
    <div className="space-y-5">
      {renderStep0()}
      <hr className="std-rule" />
      {renderStep1()}
      <hr className="std-rule" />
      {renderStep2()}
      <hr className="std-rule" />
      {renderStep3()}
    </div>
  );

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3];
  const isLastStep = step === STEP_COUNT - 1;
  const canProceed = step === 0 ? formData.name.trim().length > 0 : true;

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      <div className="std std-card p-0 w-full max-h-[90vh] overflow-y-auto rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--surface)] px-6 pt-5 pb-3 border-b border-[var(--line)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="std-kicker">New Entry · Tracker</p>
              <h2 className="std-display text-xl font-bold text-[var(--ink)]">New Habit</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleCompact}
                className="std-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--signal)] transition-colors"
              >
                {compactMode ? "Step mode" : "Quick mode"}
              </button>
              <button
                className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
                onClick={onClose}
              >
                <Cross2Icon />
              </button>
            </div>
          </div>
          {!compactMode && <ProgressDots step={step} total={STEP_COUNT} labels={STEP_LABELS} />}
        </div>

        {/* Content */}
        <div className="px-6 py-5">
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
        <div className="sticky bottom-0 bg-[var(--surface)] px-6 py-4 border-t border-[var(--line)]">
          {compactMode ? (
            <div className="flex gap-3">
              <button type="button" className="std-btn flex-1 justify-center" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="std-btn std-btn--signal flex-1 justify-center gap-2 disabled:opacity-40"
                onClick={handleSubmit}
                disabled={!formData.name.trim()}
              >
                <CheckIcon className="w-4 h-4" />
                Create
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button type="button" className="std-btn gap-1.5" onClick={goBack}>
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                {step === 0 ? "Cancel" : "Back"}
              </button>
              <button
                type="button"
                className="std-btn std-btn--signal flex-1 justify-center gap-2 disabled:opacity-40"
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

/* ═══════════════════════════════════════
   EDIT MODE — single-page sectioned form
   ═══════════════════════════════════════ */

const EditMode = ({ isOpen, onClose, habit, onSave, onDelete, onArchive }) => {
  const [formData, setFormData] = useState({
    name: "", icon: "Target", description: "", color: "#4f46e5", category: "other",
    isActive: true, frequency: "daily", weeklyTarget: 3,
    schedule: { days: [0, 1, 2, 3, 4, 5, 6], reminderTime: "", reminderEnabled: false },
  });

  const [showDescription, setShowDescription] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  /* Populate from habit */
  useEffect(() => {
    if (habit) {
      setFormData({
        name: habit.name || "",
        icon: habit.icon || "Target",
        description: habit.description || "",
        color: habit.color || "#4f46e5",
        category: habit.category || "other",
        isActive: habit.isActive !== undefined ? habit.isActive : true,
        frequency: habit.frequency || "daily",
        weeklyTarget: habit.weeklyTarget || 3,
        schedule: {
          days: habit.schedule?.days ||
            (Array.isArray(habit.frequency) ? habit.frequency : [0, 1, 2, 3, 4, 5, 6]),
          reminderTime: habit.schedule?.reminderTime || "",
          reminderEnabled: habit.schedule?.reminderEnabled || false,
        },
      });
      setShowDescription(Boolean(habit.description));
      setShowDeleteConfirm(false);
      setErrors({});
    }
  }, [habit]);

  const handleSubmit = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (formData.frequency === "daily" && formData.schedule.days.length === 0)
      newErrors.schedule = "Please select at least one day";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    const scheduleData = {
      days: formData.frequency === "weekly" ? [0, 1, 2, 3, 4, 5, 6] : formData.schedule.days,
      reminderEnabled: formData.schedule.reminderEnabled,
      ...(formData.schedule.reminderEnabled && formData.schedule.reminderTime && {
        reminderTime: formData.schedule.reminderTime,
      }),
    };
    onSave({
      name: formData.name, description: formData.description,
      color: formData.color, icon: formData.icon, category: formData.category,
      isActive: formData.isActive, frequency: formData.frequency,
      ...(formData.frequency === "weekly" && { weeklyTarget: formData.weeklyTarget }),
      schedule: scheduleData,
    });
    onClose();
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete?.(habit._id);
      onClose();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleArchive = () => {
    onArchive?.({ ...habit, isActive: !formData.isActive });
    onClose();
  };

  const isArchived = !formData.isActive;

  /* section header */
  const SectionLabel = ({ children }) => <h3 className="std-kicker">{children}</h3>;

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      <div className="std std-card p-0 w-full max-h-[90vh] overflow-y-auto rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--surface)] px-6 pt-5 pb-4 border-b border-[var(--line)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-[var(--r-card)] flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: formData.color }}
              >
                <HabitIcon icon={formData.icon} size={20} color="#fff" />
              </div>
              <div>
                <p className="std-kicker">Tracker · Revise</p>
                <h2 className="std-display text-xl font-bold text-[var(--ink)] leading-tight">
                  Edit Habit
                </h2>
                {isArchived && (
                  <span className="std-mono text-[10px] uppercase tracking-wide text-[var(--ink-3)]">Archived</span>
                )}
              </div>
            </div>
            <button
              className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
              onClick={onClose}
            >
              <Cross2Icon />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {/* ── Section: Basics ── */}
          <div className="space-y-3">
            <SectionLabel>Basics</SectionLabel>

            {/* Name */}
            <div>
              <label className={fieldLabelCls}>
                Habit name <span className="text-[var(--rose)]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className={`${inputCls} h-12`}
                placeholder="e.g., Morning run, Read 20 pages..."
              />
              {errors.name && <p className={errorCls}>{errors.name}</p>}
            </div>

            {/* Icon picker */}
            <IconPicker value={formData.icon} onChange={(icon) => setFormData((p) => ({ ...p, icon }))} />

            {/* Description */}
            {!showDescription ? (
              <button
                type="button"
                onClick={() => setShowDescription(true)}
                className="std-mono text-[10px] uppercase tracking-wider text-[var(--signal)] hover:underline"
              >
                + Add a description
              </button>
            ) : (
              <div>
                <label className={fieldLabelCls}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className={`${inputCls} h-16 py-2.5 resize-none`}
                  placeholder="Add a note or target for yourself..."
                />
              </div>
            )}
          </div>

          <hr className="std-rule" />

          {/* ── Section: Schedule ── */}
          <div className="space-y-3">
            <SectionLabel>Schedule</SectionLabel>
            <FrequencySection formData={formData} setFormData={setFormData} errors={errors} />
          </div>

          <hr className="std-rule" />

          {/* ── Section: Style ── */}
          <div className="space-y-3">
            <SectionLabel>Style</SectionLabel>
            {/* Live preview */}
            <div className="flex items-center gap-3 px-3 py-3 std-card">
              <div
                className="w-10 h-10 rounded-[var(--r-card)] flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: formData.color }}
              >
                <HabitIcon icon={formData.icon} size={20} color="#fff" />
              </div>
              <span className="std-display text-[15px] font-bold text-[var(--ink)] truncate">
                {formData.name || "Your habit"}
              </span>
            </div>
            <StyleSection formData={formData} setFormData={setFormData} />
          </div>

          <hr className="std-rule" />

          {/* ── Section: Reminders & Status ── */}
          <div className="space-y-3">
            <SectionLabel>Reminders &amp; Status</SectionLabel>
            <ReminderToggle formData={formData} setFormData={setFormData} />

            {/* Active/Archived toggle */}
            <div className="flex items-center justify-between px-4 py-3 std-card">
              <div>
                <span className="text-sm font-medium text-[var(--ink)]">
                  {formData.isActive ? "Active" : "Archived"}
                </span>
                <p className="std-mono text-[10px] text-[var(--ink-3)] mt-0.5">
                  {formData.isActive ? "Visible in your habit tracker" : "Hidden from your habit tracker"}
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onChange={() => setFormData((p) => ({ ...p, isActive: !p.isActive }))}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--surface)] px-6 py-4 border-t border-[var(--line)]">
          <div className="flex items-center gap-2">
            {/* Destructive actions — left side */}
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="h-10 px-3 rounded-[var(--r-btn)] std-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 border"
                style={
                  showDeleteConfirm
                    ? { backgroundColor: "var(--rose)", color: "#fff", borderColor: "var(--rose)" }
                    : { color: "var(--rose)", borderColor: "color-mix(in srgb, var(--rose) 40%, transparent)" }
                }
              >
                <TrashIcon className="w-3.5 h-3.5" />
                {showDeleteConfirm ? "Confirm?" : "Delete"}
              </button>
            )}
            {onArchive && (
              <button type="button" onClick={handleArchive} className="std-btn std-btn--sm gap-1.5">
                <ArchiveIcon className="w-3.5 h-3.5" />
                {isArchived ? "Unarchive" : "Archive"}
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Primary actions — right side */}
            <button type="button" className="std-btn std-btn--sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="std-btn std-btn--signal std-btn--sm gap-2 disabled:opacity-40"
              onClick={handleSubmit}
              disabled={!formData.name.trim()}
            >
              <CheckIcon className="w-4 h-4" />
              Save
            </button>
          </div>
          {showDeleteConfirm && (
            <p className="std-mono text-[10px] uppercase tracking-wide text-[var(--rose)] mt-2 text-center">
              Click Delete again to permanently remove this habit and all its entries.
            </p>
          )}
        </div>
      </div>
    </AnimatedModal>
  );
};

/* ═══════════════════════════════════════
   UNIFIED EXPORT
   Pass `habit` prop to enter edit mode.
   Omit (or null) for add mode.
   ═══════════════════════════════════════ */

const HabitModal = ({ isOpen, onClose, onSave, userId, habit = null, onDelete, onArchive }) => {
  const isEditMode = Boolean(habit);

  if (isEditMode) {
    return (
      <EditMode
        isOpen={isOpen}
        onClose={onClose}
        habit={habit}
        onSave={onSave}
        onDelete={onDelete}
        onArchive={onArchive}
      />
    );
  }

  return (
    <AddMode
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      userId={userId}
    />
  );
};

export default HabitModal;
