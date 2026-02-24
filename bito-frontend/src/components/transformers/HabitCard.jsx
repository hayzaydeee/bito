import { useState } from "react";
import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { DIFFICULTY_COLORS, METHODOLOGY_LABELS } from "../../data/categoryMeta";

/**
 * HabitCard — displays a single habit within a transformer detail view.
 * Supports view + inline edit modes. Used in TransformerDetail.
 */
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

  const startEdit = () => {
    setEditForm({ ...h });
    setIsEditing(true);
  };

  const saveEdit = () => {
    onEdit?.(index, editForm);
    setIsEditing(false);
    setEditForm({});
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  // ── Edit mode ──
  if (isEditing) {
    return (
      <div
        className="p-5 rounded-2xl bg-[var(--color-surface-elevated)] border-2 space-y-4 stagger-fade-in"
        style={{
          borderColor: accentColor ? `${accentColor}40` : "var(--color-brand-600)",
          animationDelay: `${index * 60}ms`,
        }}
      >
        <div className="flex items-center gap-2">
          <input
            value={editForm.name || ""}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="flex-1 text-sm font-spartan font-semibold bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] rounded-xl px-4 py-2.5 border border-[var(--color-border-primary)]/20 focus:outline-none focus:border-[var(--color-brand-600)]"
            placeholder="Habit name"
          />
        </div>
        <textarea
          value={editForm.description || ""}
          onChange={(e) =>
            setEditForm({ ...editForm, description: e.target.value })
          }
          className="w-full text-sm font-spartan bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] rounded-xl px-4 py-2.5 border border-[var(--color-border-primary)]/20 focus:outline-none focus:border-[var(--color-brand-600)] resize-none"
          rows={2}
          placeholder="Description"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider">
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
            <label className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider">
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
        <div className="flex gap-2 justify-end">
          <button
            onClick={cancelEdit}
            className="text-xs font-spartan px-4 py-2 rounded-xl bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
          >
            Cancel
          </button>
          <button
            onClick={saveEdit}
            className="text-xs font-spartan font-medium px-4 py-2 rounded-xl bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-700)]"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  // ── View mode ──
  return (
    <div
      className={`rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40 transition-all group stagger-fade-in ${
        compact ? "p-3" : "p-5"
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className={`flex-shrink-0 mt-0.5 ${compact ? "text-base" : "text-xl"}`}>
          {h.icon}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-spartan font-semibold text-[var(--color-text-primary)] ${compact ? "text-xs" : "text-sm"}`}>
              {h.name}
            </p>
            <span
              className={`text-[10px] font-spartan font-medium px-2 py-0.5 rounded-md ${diff.bg} ${diff.text}`}
            >
              {h.difficulty}
            </span>
            {!h.isRequired && (
              <span className="text-[10px] font-spartan text-[var(--color-text-tertiary)] italic">
                optional
              </span>
            )}
          </div>
          {h.description && !compact && (
            <p className="text-sm text-[var(--color-text-tertiary)] font-spartan mt-1">
              {h.description}
            </p>
          )}
          <div className={`flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-tertiary)] font-spartan ${compact ? "mt-1" : "mt-2"}`}>
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
        </div>

        {/* Edit/remove controls (preview only) */}
        {isPreview && (
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={startEdit}
              className="p-2 rounded-xl hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              title="Edit habit"
            >
              <Pencil1Icon className="w-4 h-4" />
            </button>
            {canRemove && (
              <button
                onClick={() => onRemove?.(index)}
                className="p-2 rounded-xl hover:bg-red-500/10 text-[var(--color-text-tertiary)] hover:text-red-400 transition-colors"
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
