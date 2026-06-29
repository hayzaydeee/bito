import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { wizardStepVariants } from "../../utils/motion";
import { X, ArrowLeft, ArrowRight, Check, Fire, TrendUp, CalendarBlank, Handshake, Sparkle } from "@phosphor-icons/react";
import { groupsAPI } from "../../services/api";
import AnimatedModal from "./AnimatedModal";
import HabitIcon from "../shared/HabitIcon";

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

const STEP_COUNT = 5;
const STEP_LABELS = ["Type", "Basics", "Targets", "Settings", "Your Habit"];
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
          className="grp-mono text-[9px] uppercase tracking-wide transition-colors duration-200"
          style={{ color: i <= step ? "var(--signal)" : "var(--ink-3)" }}
        >
          {labels[i]}
        </span>
      </div>
    ))}
  </div>
);

const ChallengeCreateModal = ({ isOpen, groupId, onClose, onCreated }) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [habits, setHabits] = useState([]);
  const [advisorSuggestions, setAdvisorSuggestions] = useState([]);

  // Step 5 state
  const [createdChallengeId, setCreatedChallengeId] = useState(null);
  const [step5Habits, setStep5Habits] = useState([]);
  const [step5Suggestions, setStep5Suggestions] = useState([]);
  const [step5Selected, setStep5Selected] = useState(new Set());
  const [step5Suggesting, setStep5Suggesting] = useState(false);
  const [step5Error, setStep5Error] = useState("");

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
      groupsAPI
        .getChallengeAdvisor(groupId)
        .then((r) => setAdvisorSuggestions(r.suggestions || []))
        .catch(() => setAdvisorSuggestions([]));
      setStep(0);
      setError("");
      setAdvisorSuggestions([]);
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

  const buildPayload = (f) => ({
    title: f.name.trim(),
    description: f.description.trim(),
    type: f.type,
    startDate: f.startDate,
    endDate: f.endDate,
    rules: {
      targetValue: Number(f.targetValue) || 7,
      targetUnit: f.targetUnit,
    },
    settings: {
      allowLateJoin: f.allowLateJoin,
      showLeaderboard: f.showLeaderboard,
      ...(f.maxParticipants ? { maxParticipants: Number(f.maxParticipants) } : {}),
    },
    ...(f.linkedHabitId ? { linkedHabitId: f.linkedHabitId } : {}),
    ...(f.habitSlot.trim() ? { habitSlot: f.habitSlot.trim() } : {}),
    habitMatchMode: f.habitMatchMode,
    ...(f.habitMatchMode === 'minimum' ? { habitMatchMinimum: Number(f.habitMatchMinimum) || 2 } : {}),
  });

  const fetchStep5Habits = useCallback(async (challengeId) => {
    setStep5Suggesting(true);
    try {
      const res = await groupsAPI.suggestHabitsForChallenge(challengeId);
      if (res.success) {
        setStep5Habits(res.habits || []);
        setStep5Suggestions(res.suggestions || []);
        const preSelected = new Set();
        (res.suggestions || []).forEach((s) => { if (s.score >= 70) preSelected.add(s.habitId); });
        setStep5Selected((prev) => prev.size === 0 ? preSelected : prev);
      }
    } catch {
      // AI fails silently — picker still works
    } finally {
      setStep5Suggesting(false);
    }
  }, []);

  const goNext = useCallback(async () => {
    let err = "";
    if (step === 1) {
      if (!form.name.trim()) err = "Name is required";
      else if (!form.startDate || !form.endDate) err = "Dates are required";
      else if (new Date(form.endDate) <= new Date(form.startDate)) err = "End date must be after start date";
    }
    if (err) { setError(err); return; }
    setError("");

    // Step 3 → Step 4: fire create API before advancing
    if (step === 3) {
      setLoading(true);
      try {
        const res = await groupsAPI.createChallenge(groupId, buildPayload(form));
        if (res.success) {
          setCreatedChallengeId(res.challenge._id);
          setStep5Selected(new Set());
          setStep5Error("");
          setDirection(1);
          setStep(4);
          fetchStep5Habits(res.challenge._id);
        } else {
          setError(res.error || "Failed to create challenge — try again");
        }
      } catch (e) {
        setError(e.message || "Failed to create challenge — try again");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step >= STEP_COUNT - 1) return;
    setDirection(1);
    setStep((s) => s + 1);
  }, [step, form, groupId, fetchStep5Habits]);

  const rollbackStep5 = useCallback(() => {
    if (createdChallengeId) {
      groupsAPI.cancelChallenge(createdChallengeId).catch(() => {});
      setCreatedChallengeId(null);
    }
  }, [createdChallengeId]);

  const goBack = useCallback(() => {
    if (step === 4) {
      rollbackStep5();
      setDirection(-1);
      setStep(3);
      return;
    }
    if (step <= 0) { onClose(); return; }
    setDirection(-1);
    setStep((s) => s - 1);
  }, [step, onClose, rollbackStep5]);

  const handleClose = useCallback(() => {
    if (step === 4) rollbackStep5();
    onClose();
  }, [step, onClose, rollbackStep5]);

  const handleStep4Confirm = useCallback(async (overrideIds) => {
    const ids = overrideIds !== undefined ? overrideIds : [...step5Selected];
    setStep5Error("");
    setLoading(true);
    try {
      await groupsAPI.joinChallenge(createdChallengeId, ids);
      onCreated?.();
      onClose();
    } catch (e) {
      setStep5Error(e.message || "Failed to join — try again");
    } finally {
      setLoading(false);
    }
  }, [step5Selected, createdChallengeId, onCreated, onClose]);

  const handleCompactCreate = async () => {
    let err = "";
    if (!form.name.trim()) err = "Name is required";
    else if (!form.startDate || !form.endDate) err = "Dates are required";
    else if (new Date(form.endDate) <= new Date(form.startDate)) err = "End date must be after start date";
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");
    try {
      const res = await groupsAPI.createChallenge(groupId, buildPayload(form));
      if (res.success) {
        setCreatedChallengeId(res.challenge._id);
        setStep5Selected(new Set());
        setStep5Error("");
        setCompactMode(false);
        setStep(4);
        fetchStep5Habits(res.challenge._id);
      } else {
        setError(res.error || "Failed to create challenge");
      }
    } catch (e) {
      setError(e.message || "Failed to create challenge");
    } finally {
      setLoading(false);
    }
  };

  const toggleCompact = () => {
    const next = !compactMode;
    setCompactMode(next);
    try { localStorage.setItem(LS_COMPACT_KEY, String(next)); } catch {}
    if (!next) setStep(0);
  };

  const renderStep4 = () => {
    const suggestedIds = new Set(step5Suggestions.map((s) => s.habitId));
    const nonSuggested = step5Habits.filter((h) => !suggestedIds.has(h._id));
    const isSingle = !form.habitMatchMode || form.habitMatchMode === "single";

    const toggleHabit = (id) => {
      setStep5Selected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) { next.delete(id); }
        else { if (isSingle) next.clear(); next.add(id); }
        return next;
      });
    };

    const HabitRow = ({ habit, score, reason }) => {
      const isSelected = step5Selected.has(habit._id);
      return (
        <button
          onClick={() => toggleHabit(habit._id)}
          className={`w-full text-left p-3 rounded-xl border transition-colors ${
            isSelected ? "border-[var(--signal)] bg-[var(--signal)]/5" : "border-[var(--line-2)] hover:border-[var(--line-3)]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              isSelected ? "bg-[var(--signal)] border-[var(--signal)]" : "border-[var(--line-2)]"
            }`}>
              {isSelected && <Check size={12} weight="bold" className="text-white" />}
            </div>
            <HabitIcon icon={habit.icon || "ClipboardText"} size={16} />
            <div className="flex-1 min-w-0">
              <p className="grp-mono text-sm font-medium text-[var(--ink)] truncate">{habit.name}</p>
              {reason && <p className="grp-mono text-[10px] text-[var(--ink-3)] mt-0.5 truncate">{reason}</p>}
            </div>
            {score && (
              <span className="grp-mono text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--signal)]/10 text-[var(--signal)]">
                {score}%
              </span>
            )}
          </div>
        </button>
      );
    };

    return (
      <div className="space-y-4">
        <p className="grp-mono text-xs text-[var(--ink-2)]">
          Link a habit to track your progress in this challenge.
        </p>

        {step5Suggesting && (
          <p className="grp-mono text-[10px] text-[var(--ink-3)] animate-pulse">Finding best habit matches…</p>
        )}

        {!step5Suggesting && step5Habits.length === 0 && (
          <p className="grp-mono text-sm text-[var(--ink-3)] text-center py-4">
            You don't have any habits yet. Create a habit first.
          </p>
        )}

        {step5Suggestions.length > 0 && !step5Suggesting && (
          <div>
            <p className="grp-kicker mb-2">✨ Suggested</p>
            <div className="space-y-2">
              {step5Suggestions.map((s) => {
                const h = step5Habits.find((h) => h._id === s.habitId);
                if (!h) return null;
                return <HabitRow key={h._id} habit={h} score={s.score} reason={s.reason} />;
              })}
            </div>
          </div>
        )}

        {nonSuggested.length > 0 && (
          <div>
            {step5Suggestions.length > 0 && <p className="grp-kicker mb-2">All habits</p>}
            <div className="space-y-2">
              {nonSuggested.map((h) => <HabitRow key={h._id} habit={h} />)}
            </div>
          </div>
        )}

        {form.type === "team_goal" && (
          <button
            onClick={() => handleStep4Confirm([])}
            disabled={loading}
            className="w-full text-xs text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors py-2"
          >
            Skip — I'm organizing, not competing
          </button>
        )}

        {step5Error && <p className="grp-mono text-[11px] text-[var(--rose)]">{step5Error}</p>}
      </div>
    );
  };

  const advisorTypeSet = new Set(advisorSuggestions.map((s) => s.type));

  const renderStep0 = () => (
    <div className="space-y-4">
      {advisorSuggestions.length > 0 && (
        <div className="flex items-center gap-1.5 grp-mono text-[10px] text-[var(--signal)] uppercase tracking-wider">
          <Sparkle size={12} weight="fill" />
          AI suggestions highlighted below
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {CHALLENGE_TYPES.map((t) => {
          const aiSuggested = advisorTypeSet.has(t.value);
          const aiHint = advisorSuggestions.find((s) => s.type === t.value);
          return (
            <button
              key={t.value}
              onClick={() => {
                setForm((p) => ({ ...p, type: t.value }));
                if (!compactMode) {
                  setDirection(1);
                  setStep(1);
                }
              }}
              className={`p-4 rounded-[12px] border text-left transition-colors relative ${
                form.type === t.value
                  ? "border-[var(--signal)]/55 bg-[var(--signal)]/8"
                  : aiSuggested
                  ? "border-[var(--signal)]/25 hover:border-[var(--signal)]/45"
                  : "border-[var(--line-2)] hover:border-[var(--line-3)]"
              }`}
            >
              {aiSuggested && (
                <span className="absolute top-2 right-2 flex items-center gap-0.5 grp-mono text-[9px] font-semibold text-[var(--signal)] bg-[var(--signal)]/10 px-1.5 py-0.5 rounded-full">
                  <Sparkle size={8} weight="fill" />
                  AI
                </span>
              )}
              <t.Icon size={22} weight="duotone" className="text-[var(--signal)]" />
              <p className="grp-display text-base font-bold text-[var(--ink)] mt-2">{t.label}</p>
              <p className="grp-mono text-[10px] text-[var(--ink-3)] mt-1 uppercase tracking-wider">{t.desc}</p>
              {aiSuggested && aiHint?.rationale && (
                <p className="grp-mono text-[9px] text-[var(--signal)] mt-1.5 leading-snug">{aiHint.rationale}</p>
              )}
            </button>
          );
        })}
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

  const renderStep2 = () => {
    const advisorMatch = advisorSuggestions.find((s) => s.type === form.type);
    const applyAdvisor = () => {
      if (!advisorMatch) return;
      setForm((p) => ({
        ...p,
        targetValue: advisorMatch.targetValue ?? p.targetValue,
        targetUnit: advisorMatch.targetUnit ?? p.targetUnit,
        habitSlot: advisorMatch.habitSlot || p.habitSlot,
      }));
    };

    return (
    <div className="space-y-4">
      {/* AI pre-fill banner */}
      {advisorMatch && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--signal)]/5 border border-[var(--signal)]/15">
          <div>
            <p className="grp-mono text-[10px] font-semibold text-[var(--signal)] flex items-center gap-1">
              <Sparkle size={10} weight="fill" />
              AI suggestion for {form.type}
            </p>
            <p className="grp-mono text-[9px] text-[var(--ink-3)] mt-0.5">
              Target: {advisorMatch.targetValue} {advisorMatch.targetUnit} · {advisorMatch.duration}d
            </p>
          </div>
          <button
            type="button"
            onClick={applyAdvisor}
            className="grp-mono text-[10px] font-semibold text-[var(--signal)] hover:underline"
          >
            Pre-fill
          </button>
        </div>
      )}
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
  };

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

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];
  const isLastStep = step === STEP_COUNT - 1;

  if (!isOpen) return null;

  return (
    <AnimatedModal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-xl">
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
                onClick={handleClose}
              >
                <X size={16} />
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
            <div className="flex flex-col gap-2">
              {error && <p className="grp-mono text-[11px] text-[var(--rose)]">{error}</p>}
              <div className="flex gap-3">
                <button type="button" className="grp-btn flex-1 justify-center" onClick={handleClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="grp-btn grp-btn--signal flex-1 justify-center gap-2 disabled:opacity-40"
                  onClick={handleCompactCreate}
                  disabled={loading}
                >
                  <Check size={16} />
                  {loading ? "Creating…" : "Create"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button type="button" className="grp-btn gap-1.5" onClick={step === 4 ? goBack : goBack}>
                <ArrowLeft size={14} weight="bold" />
                {step === 0 ? "Cancel" : "Back"}
              </button>
              <button
                type="button"
                className="grp-btn grp-btn--signal flex-1 justify-center gap-2 disabled:opacity-40"
                onClick={isLastStep ? () => handleStep4Confirm() : goNext}
                disabled={loading || (isLastStep && step5Habits.length === 0 && !step5Suggesting)}
              >
                {isLastStep ? (
                  <>
                    <Check size={16} />
                    {loading ? "Joining…" : "Join & Finish"}
                  </>
                ) : step === 3 ? (
                  <>
                    {loading ? "Creating…" : "Continue"}
                    {!loading && <ArrowRight size={14} weight="bold" />}
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={14} weight="bold" />
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
