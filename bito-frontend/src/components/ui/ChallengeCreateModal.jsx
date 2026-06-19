import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { wizardStepVariants } from "../../utils/motion";
import { Cross2Icon, ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons";
import { Fire, TrendUp, CalendarBlank, Handshake } from "@phosphor-icons/react";
import { groupsAPI } from "../../services/api";
import AnimatedModal from "./AnimatedModal";

const CHALLENGE_TYPES = [
  { value: "streak", label: "Streak", Icon: Fire, desc: "Maintain consecutive days" },
  { value: "cumulative", label: "Cumulative", Icon: TrendUp, desc: "Reach a total target" },
  { value: "consistency", label: "Consistency", Icon: CalendarBlank, desc: "Hit a completion-rate %" },
  { value: "team_goal", label: "Team Goal", Icon: Handshake, desc: "Group works toward one total" },
];

const TARGET_UNITS = [
  { value: "days", label: "Days" },
  { value: "times", label: "Times" },
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "percent", label: "%" },
];

const STEP_COUNT = 4;
const STEP_LABELS = ["Type", "Basics", "Targets", "Settings"];
const LS_COMPACT_KEY = "bito_wizard_compact_challenge";

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}
function nextWeek() {
  const d = new Date();
  d.setDate(d.getDate() + 8);
  return d.toISOString().split("T")[0];
}

const inputClass =
  "w-full h-10 px-3 bg-[var(--bg-2)] border border-[var(--line-2)] rounded-[10px] text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:border-[var(--signal)] transition-colors";

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

const ChallengeCreateModal = ({ isOpen, groupId, onClose, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [habits, setHabits] = useState([]);

  const [compactMode, setCompactMode] = useState(() => {
    try { return localStorage.getItem(LS_COMPACT_KEY) === "true"; }
    catch { return false; }
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "streak",
    startDate: tomorrow(),
    endDate: nextWeek(),
    targetValue: 7,
    targetUnit: "days",
    linkedHabitId: "",
    habitSlot: "",
    habitMatchMode: "single",
    habitMatchMinimum: 2,
    maxParticipants: "",
    allowLateJoin: true,
    showLeaderboard: true,
  });

  useEffect(() => {
    if (isOpen && groupId) {
      groupsAPI
        .getGroupHabits(groupId)
        .then((r) => setHabits(r.habits || []))
        .catch(() => setHabits([]));
      setStep(0);
      setError("");
      setForm({
        name: "",
        description: "",
        type: "streak",
        startDate: tomorrow(),
        endDate: nextWeek(),
        targetValue: 7,
        targetUnit: "days",
        linkedHabitId: "",
        habitSlot: "",
        habitMatchMode: "single",
        habitMatchMinimum: 2,
        maxParticipants: "",
        allowLateJoin: true,
        showLeaderboard: true,
      });
    }
  }, [isOpen, groupId]);

  const set = (key) => (e) =>
    setForm((p) => ({
      ...p,
      [key]: e.target?.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const goNext = useCallback(() => {
    let err = "";
    if (step === 1) {
      if (!form.name.trim()) err = "Name is required";
      else if (!form.startDate || !form.endDate) err = "Dates are required";
      else if (new Date(form.endDate) <= new Date(form.startDate)) err = "End date must be after start date";
    }
    if (err) { setError(err); return; }
    setError("");
    if (step >= STEP_COUNT - 1) return;
    setDirection(1);
    setStep((s) => s + 1);
  }, [step, form]);

  const goBack = useCallback(() => {
    if (step <= 0) { onClose(); return; }
    setDirection(-1);
    setStep((s) => s - 1);
  }, [step, onClose]);

  const toggleCompact = () => {
    const next = !compactMode;
    setCompactMode(next);
    try { localStorage.setItem(LS_COMPACT_KEY, String(next)); } catch {}
    if (!next) setStep(0);
  };

  const handleSubmit = async () => {
    let err = "";
    if (!form.name.trim()) err = "Name is required";
    else if (!form.startDate || !form.endDate) err = "Dates are required";
    else if (new Date(form.endDate) <= new Date(form.startDate)) err = "End date must be after start date";
    if (err) { setError(err); return; }

    setLoading(true);
    setError("");

    try {
      const payload = {
        title: form.name.trim(),
        description: form.description.trim(),
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        rules: {
          targetValue: Number(form.targetValue) || 7,
          targetUnit: form.targetUnit,
        },
        settings: {
          allowLateJoin: form.allowLateJoin,
          showLeaderboard: form.showLeaderboard,
          ...(form.maxParticipants ? { maxParticipants: Number(form.maxParticipants) } : {}),
        },
        ...(form.linkedHabitId ? { linkedHabitId: form.linkedHabitId } : {}),
        ...(form.habitSlot.trim() ? { habitSlot: form.habitSlot.trim() } : {}),
        habitMatchMode: form.habitMatchMode,
        ...(form.habitMatchMode === 'minimum' ? { habitMatchMinimum: Number(form.habitMatchMinimum) || 2 } : {}),
      };

      const res = await groupsAPI.createChallenge(groupId, payload);
      if (res.success) {
        onSuccess?.(res.challenge);
        onClose();
      } else {
        setError(res.error || "Failed to create challenge");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderStep0 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {CHALLENGE_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setForm((p) => ({ ...p, type: t.value }));
              if (!compactMode) {
                setDirection(1);
                setStep(1);
              }
            }}
            className={`p-4 rounded-[12px] border text-left transition-colors ${
              form.type === t.value
                ? "border-[var(--signal)]/55 bg-[var(--signal)]/8"
                : "border-[var(--line-2)] hover:border-[var(--line-3)]"
            }`}
          >
            <t.Icon size={22} weight="duotone" className="text-[var(--signal)]" />
            <p className="grp-display text-base font-bold text-[var(--ink)] mt-2">{t.label}</p>
            <p className="grp-mono text-[10px] text-[var(--ink-3)] mt-1 uppercase tracking-wider">{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      {/* name */}
      <div>
        <label className="grp-kicker block mb-1.5">Name *</label>
        <input value={form.name} onChange={set("name")} placeholder="e.g. 7-Day Meditation Streak" className={inputClass} />
      </div>

      {/* description */}
      <div>
        <label className="grp-kicker block mb-1.5">Description</label>
        <textarea value={form.description} onChange={set("description")} rows={2} placeholder="Optional details…" className={`${inputClass} h-auto py-2 resize-none`} />
      </div>

      {/* dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="grp-kicker block mb-1.5">Start *</label>
          <input type="date" value={form.startDate} onChange={set("startDate")} className={inputClass} />
        </div>
        <div>
          <label className="grp-kicker block mb-1.5">End *</label>
          <input type="date" value={form.endDate} onChange={set("endDate")} className={inputClass} />
        </div>
      </div>
      {error && step === 1 && <p className="grp-mono text-[11px] text-[var(--rose)]">{error}</p>}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      {/* target */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="grp-kicker block mb-1.5">Target</label>
          <input type="number" min={1} value={form.targetValue} onChange={set("targetValue")} className={inputClass} />
        </div>
        <div>
          <label className="grp-kicker block mb-1.5">Unit</label>
          <select value={form.targetUnit} onChange={set("targetUnit")} className={inputClass}>
            {TARGET_UNITS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* linked habit */}
      {habits.length > 0 && (
        <div>
          <label className="grp-kicker block mb-1.5">Link to Habit (optional)</label>
          <select value={form.linkedHabitId} onChange={set("linkedHabitId")} className={inputClass}>
            <option value="">Any habit</option>
            {habits.map((h) => (
              <option key={h._id} value={h._id}>{h.icon} {h.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* habit slot description */}
      <div>
        <label className="grp-kicker block mb-1.5">
          Habit Slot <span className="text-[var(--ink-3)] font-normal normal-case">(describe qualifying habits)</span>
        </label>
        <input
          value={form.habitSlot}
          onChange={set("habitSlot")}
          placeholder="e.g. Any exercise or movement habit"
          maxLength={200}
          className={inputClass}
        />
      </div>

      {/* habit match mode */}
      <div>
        <label className="grp-kicker block mb-1.5">Habit Match Mode</label>
        <select value={form.habitMatchMode} onChange={set("habitMatchMode")} className={inputClass}>
          <option value="single">Single — one habit tracks progress</option>
          <option value="any">Any — complete any linked habit to count</option>
          <option value="all">All — must complete every linked habit</option>
          <option value="minimum">Minimum — complete at least N habits</option>
        </select>
      </div>

      {/* minimum count */}
      {form.habitMatchMode === "minimum" && (
        <div>
          <label className="grp-kicker block mb-1.5">Minimum habits per day</label>
          <input type="number" min={1} value={form.habitMatchMinimum} onChange={set("habitMatchMinimum")} className={inputClass} />
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      {/* settings */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.allowLateJoin} onChange={set("allowLateJoin")} className="rounded accent-[var(--signal)]" />
          <span className="text-sm text-[var(--ink)]">Allow late join</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.showLeaderboard} onChange={set("showLeaderboard")} className="rounded accent-[var(--signal)]" />
          <span className="text-sm text-[var(--ink)]">Show leaderboard</span>
        </label>
      </div>

      {/* max participants */}
      <div>
        <label className="grp-kicker block mb-1.5">Max Participants (empty = unlimited)</label>
        <input type="number" min={2} value={form.maxParticipants} onChange={set("maxParticipants")} placeholder="Unlimited" className={inputClass} />
      </div>

      {error && step === 3 && <p className="grp-mono text-[11px] text-[var(--rose)]">{error}</p>}
    </div>
  );

  const renderCompact = () => (
    <div className="space-y-5">
      {renderStep0()}
      <hr className="border-[var(--line-2)]" />
      {renderStep1()}
      <hr className="border-[var(--line-2)]" />
      {renderStep2()}
      <hr className="border-[var(--line-2)]" />
      {renderStep3()}
    </div>
  );

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3];
  const isLastStep = step === STEP_COUNT - 1;

  if (!isOpen) return null;

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      <div className="grp relative w-full bg-[var(--surface)] rounded-[16px] border border-[var(--line-2)] max-h-[85vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--surface)] px-6 pt-5 pb-3 border-b border-[var(--line-2)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="grp-kicker">Challenge Setup</p>
              <h2 className="grp-display text-xl font-bold text-[var(--ink)]">New Challenge</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleCompact}
                className="grp-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--signal)] transition-colors"
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
        <div className="sticky bottom-0 bg-[var(--surface)] px-6 py-4 border-t border-[var(--line-2)]">
          {compactMode ? (
            <div className="flex gap-3">
              <button type="button" className="grp-btn flex-1 justify-center" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="grp-btn grp-btn--signal flex-1 justify-center gap-2 disabled:opacity-40"
                onClick={handleSubmit}
                disabled={loading}
              >
                <CheckIcon className="w-4 h-4" />
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button type="button" className="grp-btn gap-1.5" onClick={goBack}>
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                {step === 0 ? "Cancel" : "Back"}
              </button>
              <button
                type="button"
                className="grp-btn grp-btn--signal flex-1 justify-center gap-2 disabled:opacity-40"
                onClick={isLastStep ? handleSubmit : goNext}
                disabled={loading}
              >
                {isLastStep ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    {loading ? "Creating..." : "Create Challenge"}
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

export default ChallengeCreateModal;
