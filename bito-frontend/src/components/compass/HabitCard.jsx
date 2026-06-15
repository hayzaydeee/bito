import { useState } from "react";
import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import CATEGORY_META, { DIFFICULTY_COLORS, METHODOLOGY_LABELS } from "../../data/categoryMeta";
import HabitIcon from "../shared/HabitIcon";

/**
 * HabitCard — displays a single habit within a compass detail view.
 * Shows day-of-week pills, category badge, full schedule info.
 * Supports view + rich inline edit with day toggles, methodology/frequency/difficulty pickers.
 */

const ALL_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = { mon: "M", tue: "Tu", wed: "W", thu: "Th", fri: "F", sat: "S", sun: "Su" };
const DAY_FULL = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

const HabitCard = ({
  habit,
  index,
  phaseIndex,
  isPreview = false,
  canRemove = true,
  onEdit,
  onRemove,
  accentColor,
  compact = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const h = habit;
  const diff = DIFFICULTY_COLORS[h.difficulty] || DIFFICULTY_COLORS.medium;
  const catMeta = CATEGORY_META[h.category] || null;

  const startEdit = () => {
    setEditForm({
      ...h,
      frequency: { ...(h.frequency || { type: "daily" }) },
      target: { ...(h.target || {}) },
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    onEdit?.(index, editForm, phaseIndex);
    setIsEditing(false);
    setEditForm({});
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  // Toggle a day in the edit form's frequency.days array
  const toggleDay = (day) => {
    const current = editForm.frequency?.days || [];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    setEditForm({
      ...editForm,
      frequency: { ...editForm.frequency, days: next },
    });
  };

  // Resolve which days are active for the day-of-week pills (view mode)
  const activeDays =
    h.frequency?.type === "specific_days"
      ? h.frequency.days || []
      : h.frequency?.type === "daily"
      ? ALL_DAYS
      : [];

  // ── Edit mode ──
  if (isEditing) {
    const freqType = editForm.frequency?.type || "daily";

    return (
      <div
        className="std-card p-5 border-2 space-y-4 stagger-fade-in"
        style={{
          borderColor: accentColor ? `${accentColor}40` : "var(--signal)",
          animationDelay: `${index * 60}ms`,
        }}
      >
        {/* Name */}
        <div className="flex items-center gap-2">
          <input
            value={editForm.name || ""}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="flex-1 text-sm font-spartan font-semibold bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] rounded-xl px-4 py-2.5 border border-[var(--color-border-primary)]/20 focus:outline-none focus:border-[var(--color-brand-600)]"
            placeholder="Habit name"
          />
        </div>

        {/* Description */}
        <textarea
          value={editForm.description || ""}
          onChange={(e) =>
            setEditForm({ ...editForm, description: e.target.value })
          }
          className="w-full text-sm font-spartan bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] rounded-xl px-4 py-2.5 border border-[var(--color-border-primary)]/20 focus:outline-none focus:border-[var(--color-brand-600)] resize-none"
          rows={2}
          placeholder="Description"
        />

        {/* Methodology + Difficulty row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1 block">
              Tracking
            </label>
            <select
              value={editForm.methodology || "boolean"}
              onChange={(e) =>
                setEditForm({ ...editForm, methodology: e.target.value })
              }
              className="w-full text-sm font-spartan bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] rounded-xl px-3 py-2 border border-[var(--color-border-primary)]/20 focus:outline-none appearance-none"
            >
              {Object.entries(METHODOLOGY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1 block">
              Difficulty
            </label>
            <div className="flex gap-1.5">
              {["easy", "medium", "hard"].map((d) => {
                const dc = DIFFICULTY_COLORS[d];
                const active = editForm.difficulty === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, difficulty: d })}
                    className={`flex-1 text-xs font-spartan font-medium py-2 rounded-lg transition-all border ${
                      active
                        ? `${dc.bg} ${dc.text} border-current`
                        : "border-[var(--color-border-primary)]/20 text-[var(--color-text-tertiary)] hover:border-[var(--color-border-primary)]/40"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Frequency type */}
        <div>
          <label className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1.5 block">
            Frequency
          </label>
          <div className="flex gap-1.5">
            {[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "x/week" },
              { value: "specific_days", label: "Specific days" },
            ].map((opt) => {
              const active = freqType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setEditForm({
                      ...editForm,
                      frequency: { ...editForm.frequency, type: opt.value },
                    })
                  }
                  className={`px-3 py-1.5 text-xs font-spartan rounded-lg transition-all border ${
                    active
                      ? "bg-[var(--color-brand-500)]/15 text-[var(--color-brand-500)] border-[var(--color-brand-500)]/30"
                      : "border-[var(--color-border-primary)]/20 text-[var(--color-text-tertiary)] hover:border-[var(--color-border-primary)]/40"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Weekly: times per week */}
          {freqType === "weekly" && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={7}
                value={editForm.frequency?.timesPerWeek || 3}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    frequency: {
                      ...editForm.frequency,
                      timesPerWeek: Math.min(7, Math.max(1, Number(e.target.value))),
                    },
                  })
                }
                className="w-16 text-sm font-spartan bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] rounded-lg px-3 py-1.5 border border-[var(--color-border-primary)]/20 focus:outline-none text-center"
              />
              <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">
                times per week
              </span>
            </div>
          )}

          {/* Specific days: day toggle pills */}
          {freqType === "specific_days" && (
            <div className="mt-2 flex gap-1.5">
              {ALL_DAYS.map((day) => {
                const active = (editForm.frequency?.days || []).includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`w-9 h-9 rounded-full text-xs font-spartan font-medium transition-all border ${
                      active
                        ? "bg-[var(--color-brand-500)] text-white border-[var(--color-brand-500)]"
                        : "border-[var(--color-border-primary)]/30 text-[var(--color-text-tertiary)] hover:border-[var(--color-brand-500)]/40"
                    }`}
                    title={DAY_FULL[day]}
                  >
                    {DAY_LABELS[day]}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Target value + unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1 block">
              Target value
            </label>
            <input
              type="number"
              value={editForm.target?.value || ""}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  target: { ...editForm.target, value: Number(e.target.value) },
                })
              }
              className="w-full text-sm font-spartan bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] rounded-xl px-4 py-2 border border-[var(--color-border-primary)]/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1 block">
              Unit
            </label>
            <input
              value={editForm.target?.unit || ""}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  target: { ...editForm.target, unit: e.target.value },
                })
              }
              className="w-full text-sm font-spartan bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] rounded-xl px-4 py-2 border border-[var(--color-border-primary)]/20 focus:outline-none"
              placeholder="minutes, pages, etc."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button onClick={cancelEdit} className="std-btn std-btn--sm">
            Cancel
          </button>
          <button onClick={saveEdit} className="std-btn std-btn--sm std-btn--signal">
            Save
          </button>
        </div>
      </div>
    );
  }

  // ── View mode ──
  return (
    <div
      className={`std-card std-card-hover group stagger-fade-in ${
        compact ? "p-3" : "p-5"
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className={`flex-shrink-0 mt-0.5 ${compact ? "text-base" : "text-xl"}`}>
          <HabitIcon icon={h.icon} size={16} />
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold text-[var(--ink)] ${compact ? "text-xs" : "text-sm"}`}>
              {h.name}
            </p>
            <span
              className={`std-mono text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-[var(--r-tag)] ${diff.bg} ${diff.text}`}
            >
              {h.difficulty}
            </span>
            {catMeta && (
              <span className="std-mono text-[9px] uppercase tracking-wide text-[var(--ink-3)] flex items-center gap-1">
                <HabitIcon icon={catMeta.icon} size={10} />{catMeta.label}
              </span>
            )}
            {!h.isRequired && (
              <span className="std-mono text-[9px] uppercase tracking-wide text-[var(--ink-3)]">
                optional
              </span>
            )}
          </div>

          {h.description && !compact && (
            <p className="text-sm text-[var(--ink-3)] mt-1 leading-relaxed">
              {h.description}
            </p>
          )}

          {/* Metadata row: methodology, frequency text, target */}
          <div className={`std-mono flex flex-wrap items-center gap-3 text-[10.5px] text-[var(--ink-3)] ${compact ? "mt-1" : "mt-2"}`}>
            <span>{METHODOLOGY_LABELS[h.methodology] || h.methodology}</span>
            <span>
              {h.frequency?.type === "daily" && "Daily"}
              {h.frequency?.type === "weekly" &&
                `${h.frequency.timesPerWeek || 3}x/week`}
              {h.frequency?.type === "specific_days" &&
                h.frequency.days?.join(", ")}
            </span>
            {h.target?.value && (
              <span>
                {h.target.value} {h.target.unit || ""}
              </span>
            )}
          </div>

          {/* Day-of-week pills — visual schedule */}
          {!compact && activeDays.length > 0 && (
            <div className="flex gap-1 mt-2.5">
              {ALL_DAYS.map((day) => {
                const active = activeDays.includes(day);
                return (
                  <span
                    key={day}
                    className={`w-6 h-6 rounded-full flex items-center justify-center std-mono text-[10px] font-bold transition-colors ${
                      active
                        ? "text-white"
                        : "bg-[var(--surface-2)] text-[var(--ink-3)]"
                    }`}
                    style={active ? { backgroundColor: accentColor || "var(--signal)" } : undefined}
                    title={DAY_FULL[day]}
                  >
                    {DAY_LABELS[day]}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Edit/remove controls (preview only) */}
        {isPreview && (
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={startEdit}
              className="p-2 rounded-[var(--r-tag)] hover:bg-[var(--surface-2)] text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
              title="Edit habit"
            >
              <Pencil1Icon className="w-4 h-4" />
            </button>
            {canRemove && (
              <button
                onClick={() => onRemove?.(index, phaseIndex)}
                className="p-2 rounded-[var(--r-tag)] hover:bg-[var(--rose)]/10 text-[var(--ink-3)] hover:text-[var(--rose)] transition-colors"
                title="Remove habit"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitCard;
