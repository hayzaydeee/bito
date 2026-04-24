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
import { CalendarDots, Target, Barbell, BookOpen, Brain, Users, Palette, Sparkle } from "@phosphor-icons/react";
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

/* ─── Shared sub-components ─── */

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
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 font-outfit border ${
            formData.frequency !== "weekly"
              ? "bg-[var(--color-brand-500)] text-white border-[var(--color-brand-500)]"
              : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)]/40 hover:bg-[var(--color-surface-hover)]"
          }`}
        >
          Daily
        </button>
        <button
          type="button"
          onClick={() => setFormData((p) => ({ ...p, frequency: "weekly" }))}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 font-outfit border ${
            formData.frequency === "weekly"
              ? "bg-[var(--color-brand-500)] text-white border-[var(--color-brand-500)]"
              : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)]/40 hover:bg-[var(--color-surface-hover)]"
          }`}
        >
          Weekly target
        </button>
      </div>

      {formData.frequency === "weekly" ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-4 bg-[var(--color-surface-elevated)] rounded-xl">
            <span className="text-sm font-outfit text-[var(--color-text-primary)] flex-1">Complete on any</span>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, weeklyTarget: Math.max(1, p.weeklyTarget - 1) }))}
              className="w-8 h-8 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-bold text-sm flex items-center justify-center hover:bg-[var(--color-border-primary)] transition-colors"
            >
              −
            </button>
            <span className="text-xl font-bold font-spartan text-[var(--color-brand-500)] tabular-nums w-6 text-center">
              {formData.weeklyTarget}
            </span>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, weeklyTarget: Math.min(7, p.weeklyTarget + 1) }))}
              className="w-8 h-8 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-bold text-sm flex items-center justify-center hover:bg-[var(--color-border-primary)] transition-colors"
            >
              +
            </button>
            <span className="text-sm font-outfit text-[var(--color-text-primary)]">days/week</span>
          </div>
          <p className="text-[11px] text-[var(--color-text-tertiary)] font-outfit px-1 leading-relaxed">
            No fixed schedule — pick any {formData.weeklyTarget} day{formData.weeklyTarget > 1 ? "s" : ""} each week.
            Your streak counts consecutive weeks where you meet the target.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit">Which days?</label>
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
          {errors?.schedule && <p className="text-xs text-red-500 mt-1 font-outfit">{errors.schedule}</p>}
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
      <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
        Category
      </label>
      <div className="grid grid-cols-4 gap-1.5">
        {CATEGORIES.map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFormData((p) => ({ ...p, category: id }))}
            className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-xs font-outfit transition-all duration-200 border ${
              formData.category === id
                ? "bg-[var(--color-brand-500)]/10 border-[var(--color-brand-500)] text-[var(--color-brand-600)]"
                : "bg-[var(--color-surface-elevated)] border-[var(--color-border-primary)]/40 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
            }`}
          >
            <Icon size={15} weight="duotone" />
            <span className="font-medium">{label}</span>
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
  </div>
);

/* ─── Shared: Reminder toggle ─── */

const ReminderToggle = ({ formData, setFormData }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-xl">
      <div>
        <span className="text-sm font-medium text-[var(--color-text-primary)] font-outfit">Reminder</span>
        <p className="text-[11px] text-[var(--color-text-tertiary)] font-outfit">Get a nudge at the right time</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={formData.schedule.reminderEnabled}
          onChange={(e) =>
            setFormData((p) => ({ ...p, schedule: { ...p.schedule, reminderEnabled: e.target.checked } }))
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
          setFormData((p) => ({ ...p, schedule: { ...p.schedule, reminderTime: e.target.value } }))
        }
        className="w-full h-10 px-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] font-outfit focus:outline-none focus:border-[var(--color-brand-500)] transition-colors text-sm"
      />
    )}
  </div>
);

/* ═══════════════════════════════════════
   ADD MODE — 4-step wizard
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

  const renderStep0 = () => (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-base font-bold text-[var(--color-text-primary)] font-dmSerif">
          What habit do you want to build?
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)] font-outfit mt-1">
          Name it, pick an icon, and you're off.
        </p>
      </div>
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
      <IconPicker value={formData.icon} onChange={(icon) => setFormData((p) => ({ ...p, icon }))} />
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-base font-bold text-[var(--color-text-primary)] font-dmSerif">
          When will you do it?
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)] font-outfit mt-1">
          Daily habits have a fixed schedule. Weekly habits let you choose any days to hit your target.
        </p>
      </div>
      <FrequencySection formData={formData} setFormData={setFormData} errors={errors} />
    </div>
  );

  const renderStep2 = () => (
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
      <div className="flex items-center justify-center gap-3 py-2">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
          style={{ backgroundColor: formData.color }}
        >
          <HabitIcon icon={formData.icon} size={24} color="#fff" />
        </div>
        <span className="text-sm font-outfit font-medium text-[var(--color-text-primary)]">
          {formData.name || "Your habit"}
        </span>
      </div>
      <StyleSection formData={formData} setFormData={setFormData} />
      {/* Description */}
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
        <div className="text-center mb-2">
          <h3 className="text-base font-bold text-[var(--color-text-primary)] font-dmSerif">Looking good!</h3>
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
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: formData.color }}
            >
              <HabitIcon icon={formData.icon} size={22} color="#fff" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-outfit font-semibold text-[var(--color-text-primary)] truncate">{formData.name}</p>
              <p className="text-xs font-outfit text-[var(--color-text-secondary)]">{scheduleLabel}</p>
            </div>
            <span
              className="text-[10px] font-outfit px-2 py-0.5 rounded-full border"
              style={{ borderColor: "var(--color-border-primary)", color: "var(--color-text-secondary)" }}
            >
              {categoryObj?.label}
            </span>
          </div>
          {formData.description && (
            <p className="text-xs font-outfit text-[var(--color-text-tertiary)] pl-14">{formData.description}</p>
          )}
        </div>
        <ReminderToggle formData={formData} setFormData={setFormData} />
      </div>
    );
  };

  const renderCompact = () => (
    <div className="space-y-5">
      {renderStep0()}
      <hr className="border-[var(--color-border-primary)]" />
      {renderStep1()}
      <hr className="border-[var(--color-border-primary)]" />
      {renderStep2()}
      <hr className="border-[var(--color-border-primary)]" />
      {renderStep3()}
    </div>
  );

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3];
  const isLastStep = step === STEP_COUNT - 1;
  const canProceed = step === 0 ? formData.name.trim().length > 0 : true;

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      <div className="bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--color-surface-primary)] px-6 pt-5 pb-3 border-b border-[var(--color-border-primary)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif">New Habit</h2>
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
        <div className="sticky bottom-0 bg-[var(--color-surface-primary)] px-6 py-4 border-t border-[var(--color-border-primary)]">
          {compactMode ? (
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 h-11 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] rounded-xl transition-all duration-200 font-outfit font-medium text-sm"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 h-11 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] disabled:opacity-40 text-white rounded-xl transition-all duration-200 font-outfit font-semibold flex items-center justify-center gap-2 text-sm"
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
                className="h-11 px-4 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] rounded-xl transition-all duration-200 font-outfit font-medium text-sm flex items-center gap-1.5"
                onClick={goBack}
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                {step === 0 ? "Cancel" : "Back"}
              </button>
              <button
                type="button"
                className="flex-1 h-11 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] disabled:opacity-40 text-white rounded-xl transition-all duration-200 font-outfit font-semibold flex items-center justify-center gap-2 text-sm"
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
   EDIT MODE — single-page scrollable form
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

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      <div className="bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--color-surface-primary)] px-6 pt-5 pb-4 border-b border-[var(--color-border-primary)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: formData.color }}
              >
                <HabitIcon icon={formData.icon} size={18} color="#fff" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif leading-tight">
                  Edit Habit
                </h2>
                {isArchived && (
                  <span className="text-[11px] font-outfit text-[var(--color-text-tertiary)]">Archived</span>
                )}
              </div>
            </div>
            <button
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
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
            <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] font-spartan uppercase tracking-wider">
              Basics
            </h3>

            {/* Name */}
            <div>
              <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-1.5">
                Habit name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="w-full h-12 px-4 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] font-outfit placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand-500)] transition-colors text-sm"
                placeholder="e.g., Morning run, Read 20 pages..."
              />
              {errors.name && <p className="text-xs text-red-500 mt-1 font-outfit">{errors.name}</p>}
            </div>

            {/* Icon picker */}
            <IconPicker value={formData.icon} onChange={(icon) => setFormData((p) => ({ ...p, icon }))} />

            {/* Description */}
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
                <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full h-16 px-3 py-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] font-outfit placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand-500)] transition-colors resize-none text-sm"
                  placeholder="Add a note or target for yourself..."
                />
              </div>
            )}
          </div>

          <div className="border-t border-[var(--color-border-primary)]" />

          {/* ── Section: Schedule ── */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] font-spartan uppercase tracking-wider">
              Schedule
            </h3>
            <FrequencySection formData={formData} setFormData={setFormData} errors={errors} />
          </div>

          <div className="border-t border-[var(--color-border-primary)]" />

          {/* ── Section: Style ── */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] font-spartan uppercase tracking-wider">
              Style
            </h3>
            {/* Live preview */}
            <div className="flex items-center gap-3 p-3 bg-[var(--color-surface-elevated)] rounded-xl">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: formData.color }}
              >
                <HabitIcon icon={formData.icon} size={20} color="#fff" />
              </div>
              <span className="text-sm font-outfit font-medium text-[var(--color-text-primary)] truncate">
                {formData.name || "Your habit"}
              </span>
            </div>
            <StyleSection formData={formData} setFormData={setFormData} />
          </div>

          <div className="border-t border-[var(--color-border-primary)]" />

          {/* ── Section: Reminders & Status ── */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] font-spartan uppercase tracking-wider">
              Reminders &amp; Status
            </h3>
            <ReminderToggle formData={formData} setFormData={setFormData} />

            {/* Active/Archived toggle */}
            <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-xl">
              <div>
                <span className="text-sm font-medium text-[var(--color-text-primary)] font-outfit">
                  {formData.isActive ? "Active" : "Archived"}
                </span>
                <p className="text-[11px] text-[var(--color-text-tertiary)] font-outfit">
                  {formData.isActive ? "Visible in your habit tracker" : "Hidden from your habit tracker"}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={() => setFormData((p) => ({ ...p, isActive: !p.isActive }))}
                  className="sr-only"
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${
                    formData.isActive ? "bg-[var(--color-brand-500)]" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      formData.isActive ? "translate-x-5" : "translate-x-0"
                    } mt-0.5 ml-0.5`}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--color-surface-primary)] px-6 py-4 border-t border-[var(--color-border-primary)]">
          <div className="flex items-center gap-2">
            {/* Destructive actions — left side */}
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className={`h-11 px-3 rounded-xl text-xs font-outfit font-medium flex items-center gap-1.5 transition-all duration-200 border ${
                  showDeleteConfirm
                    ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                    : "text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20"
                }`}
              >
                <TrashIcon className="w-3.5 h-3.5" />
                {showDeleteConfirm ? "Confirm?" : "Delete"}
              </button>
            )}
            {onArchive && (
              <button
                type="button"
                onClick={handleArchive}
                className="h-11 px-3 rounded-xl text-xs font-outfit font-medium flex items-center gap-1.5 transition-all duration-200 border text-[var(--color-text-secondary)] border-[var(--color-border-primary)]/40 hover:bg-[var(--color-surface-hover)]"
              >
                <ArchiveIcon className="w-3.5 h-3.5" />
                {isArchived ? "Unarchive" : "Archive"}
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Primary actions — right side */}
            <button
              type="button"
              className="h-11 px-4 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] rounded-xl transition-all duration-200 font-outfit font-medium text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="h-11 px-5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] disabled:opacity-40 text-white rounded-xl transition-all duration-200 font-outfit font-semibold flex items-center gap-2 text-sm"
              onClick={handleSubmit}
              disabled={!formData.name.trim()}
            >
              <CheckIcon className="w-4 h-4" />
              Save
            </button>
          </div>
          {showDeleteConfirm && (
            <p className="text-[11px] text-red-500 font-outfit mt-2 text-center">
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
