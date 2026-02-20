import { useState, useEffect } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { groupsAPI } from "../../services/api";

/* ── constants ── */

const CHALLENGE_TYPES = [
  { value: "streak", label: "Streak", icon: "🔥", desc: "Maintain consecutive days" },
  { value: "cumulative", label: "Cumulative", icon: "📈", desc: "Reach a total target" },
  { value: "consistency", label: "Consistency", icon: "📅", desc: "Hit a completion-rate %" },
  { value: "team_goal", label: "Team Goal", icon: "🤝", desc: "Group works toward one total" },
];

const TARGET_UNITS = [
  { value: "days", label: "Days" },
  { value: "times", label: "Times" },
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "percent", label: "%" },
];

/* ── helpers ── */

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
  "w-full h-10 px-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-xl text-sm font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand-600)]/40";

/* ── component ── */

const ChallengeCreateModal = ({ isOpen, workspaceId, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [habits, setHabits] = useState([]);

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
    if (isOpen && workspaceId) {
      groupsAPI
        .getGroupHabits(workspaceId)
        .then((r) => setHabits(r.habits || []))
        .catch(() => setHabits([]));
      setStep(1);
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
  }, [isOpen, workspaceId]);

  if (!isOpen) return null;

  const set = (key) => (e) =>
    setForm((p) => ({
      ...p,
      [key]: e.target?.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const selectedType = CHALLENGE_TYPES.find((t) => t.value === form.type);

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError("Name is required");
    if (!form.startDate || !form.endDate) return setError("Dates are required");
    if (new Date(form.endDate) <= new Date(form.startDate))
      return setError("End date must be after start date");

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

      const res = await groupsAPI.createChallenge(workspaceId, payload);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)]/20 shadow-xl max-h-[85vh] overflow-y-auto">
        {/* header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-primary)]/10">
          <h2 className="text-lg font-garamond font-bold text-[var(--color-text-primary)]">
            {step === 1 ? "Choose Challenge Type" : "Challenge Details"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface-hover)] transition-colors">
            <Cross2Icon className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* ── Step 1: Pick type ── */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {CHALLENGE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setForm((p) => ({ ...p, type: t.value }))}
                    className={`p-4 rounded-xl border text-left transition-colors ${
                      form.type === t.value
                        ? "border-[var(--color-brand-600)] bg-[var(--color-brand-600)]/5"
                        : "border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40"
                    }`}
                  >
                    <span className="text-2xl">{t.icon}</span>
                    <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] mt-2">{t.label}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full h-10 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-colors"
              >
                Continue with {selectedType?.label}
              </button>
            </>
          )}

          {/* ── Step 2: Details ── */}
          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-xs font-spartan text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                ← Back ·{" "}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--color-brand-600)]/10 text-[var(--color-brand-600)] font-medium">
                  {selectedType?.icon} {selectedType?.label}
                </span>
              </button>

              {/* name */}
              <div>
                <label className="block text-xs font-spartan font-medium text-[var(--color-text-secondary)] mb-1">Name *</label>
                <input value={form.name} onChange={set("name")} placeholder="e.g. 7-Day Meditation Streak" className={inputClass} />
              </div>

              {/* description */}
              <div>
                <label className="block text-xs font-spartan font-medium text-[var(--color-text-secondary)] mb-1">Description</label>
                <textarea value={form.description} onChange={set("description")} rows={2} placeholder="Optional details…" className={`${inputClass} h-auto py-2 resize-none`} />
              </div>

              {/* dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-spartan font-medium text-[var(--color-text-secondary)] mb-1">Start *</label>
                  <input type="date" value={form.startDate} onChange={set("startDate")} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-spartan font-medium text-[var(--color-text-secondary)] mb-1">End *</label>
                  <input type="date" value={form.endDate} onChange={set("endDate")} className={inputClass} />
                </div>
              </div>

              {/* target */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-spartan font-medium text-[var(--color-text-secondary)] mb-1">Target</label>
                  <input type="number" min={1} value={form.targetValue} onChange={set("targetValue")} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-spartan font-medium text-[var(--color-text-secondary)] mb-1">Unit</label>
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
                  <label className="block text-xs font-spartan font-medium text-[var(--color-text-secondary)] mb-1">Link to Habit (optional)</label>
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
                <label className="block text-xs font-spartan font-medium text-[var(--color-text-secondary)] mb-1">
                  Habit Slot <span className="text-[var(--color-text-tertiary)]">(describe qualifying habits)</span>
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
                <label className="block text-xs font-spartan font-medium text-[var(--color-text-secondary)] mb-1">Habit Match Mode</label>
                <select value={form.habitMatchMode} onChange={set("habitMatchMode")} className={inputClass}>
                  <option value="single">Single — one habit tracks progress</option>
                  <option value="any">Any — complete any linked habit to count</option>
                  <option value="all">All — must complete every linked habit</option>
                  <option value="minimum">Minimum — complete at least N habits</option>
                </select>
              </div>

              {/* minimum count (only if mode=minimum) */}
              {form.habitMatchMode === "minimum" && (
                <div>
                  <label className="block text-xs font-spartan font-medium text-[var(--color-text-secondary)] mb-1">Minimum habits per day</label>
                  <input type="number" min={1} value={form.habitMatchMinimum} onChange={set("habitMatchMinimum")} className={inputClass} />
                </div>
              )}

              {/* settings */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.allowLateJoin} onChange={set("allowLateJoin")} className="rounded" />
                  <span className="text-sm font-spartan text-[var(--color-text-primary)]">Allow late join</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.showLeaderboard} onChange={set("showLeaderboard")} className="rounded" />
                  <span className="text-sm font-spartan text-[var(--color-text-primary)]">Show leaderboard</span>
                </label>
              </div>

              {/* max participants */}
              <div>
                <label className="block text-xs font-spartan font-medium text-[var(--color-text-secondary)] mb-1">Max Participants (empty = unlimited)</label>
                <input type="number" min={2} value={form.maxParticipants} onChange={set("maxParticipants")} placeholder="Unlimited" className={inputClass} />
              </div>

              {error && <p className="text-xs text-red-500 font-spartan">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-10 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] disabled:opacity-50 text-white rounded-xl text-sm font-spartan font-medium transition-colors"
              >
                {loading ? "Creating…" : "Create Challenge"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallengeCreateModal;
