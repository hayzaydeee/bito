import React, { useState, useCallback, memo } from 'react';
import { PlusIcon, Cross2Icon, Pencil1Icon, TrashIcon, CheckIcon } from '@radix-ui/react-icons';

/* ═══════════════════════════════════════════════════════════════
   MicroEntry — quick text capture + display cards
   ═══════════════════════════════════════════════════════════════ */

/* ── Quick capture input bar ─────────────────────────────────── */
export const QuickCapture = memo(({ onSubmit, placeholder = 'Quick thought...' }) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
  }, [text, onSubmit]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200"
      style={{
        backgroundColor: isFocused ? 'var(--color-surface-primary)' : 'var(--color-surface-secondary)',
        borderColor: isFocused ? 'var(--color-brand-300)' : 'var(--color-border-primary)',
        boxShadow: isFocused ? '0 0 0 2px rgba(99,102,241,0.1)' : 'none',
      }}
    >
      <PlusIcon
        className="w-4 h-4 flex-shrink-0 transition-colors"
        style={{ color: isFocused ? 'var(--color-brand-500)' : 'var(--color-text-tertiary)' }}
      />
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        maxLength={2000}
        className="flex-1 bg-transparent text-sm font-spartan outline-none placeholder:text-[var(--color-text-tertiary)]"
        style={{ color: 'var(--color-text-primary)' }}
      />
      {text.trim() && (
        <button
          onClick={handleSubmit}
          className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-spartan font-semibold text-white transition-colors"
          style={{ backgroundColor: 'var(--color-brand-500)' }}
        >
          Add
        </button>
      )}
    </div>
  );
});
QuickCapture.displayName = 'QuickCapture';

/* ── Single micro-entry card ─────────────────────────────────── */
export const MicroEntryCard = memo(({ entry, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(entry.plainTextContent || '');
  const [showActions, setShowActions] = useState(false);

  const handleSave = useCallback(() => {
    if (editText.trim()) {
      onEdit(entry._id, editText.trim());
    }
    setIsEditing(false);
  }, [entry._id, editText, onEdit]);

  const time = new Date(entry.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isEditing) {
    return (
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg border"
        style={{ borderColor: 'var(--color-brand-300)', backgroundColor: 'var(--color-surface-primary)' }}>
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsEditing(false); }}
          autoFocus
          className="flex-1 bg-transparent text-sm font-spartan outline-none"
          style={{ color: 'var(--color-text-primary)' }}
        />
        <button onClick={handleSave} className="p-1 rounded" style={{ color: 'var(--color-success)' }}>
          <CheckIcon className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setIsEditing(false)} className="p-1 rounded" style={{ color: 'var(--color-text-tertiary)' }}>
          <Cross2Icon className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="group flex items-start gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Bullet / timeline dot */}
      <div className="flex-shrink-0 mt-1.5">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-text-tertiary)' }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-spartan leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
          {entry.plainTextContent}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-spartan" style={{ color: 'var(--color-text-tertiary)' }}>
            {time}
          </span>
          {entry.linkedHabitId && (
            <span className="inline-flex items-center gap-1 text-[10px] font-spartan px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)' }}>
              {entry.linkedHabitId.icon || '⭐'} {entry.linkedHabitId.name}
            </span>
          )}
          {entry.tags?.map(t => (
            <span key={t} className="text-[10px] font-spartan px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-tertiary)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-1 flex-shrink-0 transition-opacity duration-150 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={() => { setEditText(entry.plainTextContent); setIsEditing(true); }}
          className="p-1.5 rounded-md border hover:bg-[var(--color-surface-elevated)] transition-colors"
          style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border-primary)' }}
          aria-label="Edit"
        >
          <Pencil1Icon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(entry._id)}
          className="p-1.5 rounded-md border hover:bg-red-50 hover:border-red-200 transition-colors"
          style={{ color: 'var(--color-error)', borderColor: 'var(--color-border-primary)' }}
          aria-label="Delete"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});
MicroEntryCard.displayName = 'MicroEntryCard';

/* ── Collapsed micro-entry stack ─────────────────────────────── */
export const MicroStack = memo(({ micros, onExpand, isExpanded, onEdit, onDelete }) => {
  if (!micros || micros.length === 0) return null;

  const visibleCount = isExpanded ? micros.length : Math.min(2, micros.length);
  const hiddenCount = micros.length - visibleCount;
  const visible = isExpanded ? micros : micros.slice(-2); // Show most recent when collapsed

  return (
    <div className="space-y-0.5">
      {/* Section label */}
      <div className="flex items-center justify-between px-3 mb-1">
        <span className="text-[10px] font-spartan font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-tertiary)' }}>
          Quick notes · {micros.length}
        </span>
        {micros.length > 2 && (
          <button
            onClick={onExpand}
            className="text-[10px] font-spartan font-semibold transition-colors hover:text-[var(--color-brand-500)]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {isExpanded ? 'Collapse' : `Show all ${micros.length}`}
          </button>
        )}
      </div>

      {/* Micro entries */}
      {visible.map(micro => (
        <MicroEntryCard
          key={micro._id}
          entry={micro}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}

      {/* Hidden count indicator */}
      {!isExpanded && hiddenCount > 0 && (
        <button
          onClick={onExpand}
          className="w-full py-1 text-[10px] font-spartan text-center transition-colors"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          +{hiddenCount} more
        </button>
      )}
    </div>
  );
});
MicroStack.displayName = 'MicroStack';
