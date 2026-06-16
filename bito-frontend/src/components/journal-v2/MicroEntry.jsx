import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { PlusIcon, Cross2Icon, Pencil1Icon, TrashIcon, CheckIcon } from '@radix-ui/react-icons';
import HabitIcon from '../shared/HabitIcon';

/* ═══════════════════════════════════════════════════════════════
   MicroEntry — quick capture + the captain's-log (DRILL)
   Bullet timeline, mono timestamps, hairline tokens.
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
      className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--r-btn)] border transition-all duration-200"
      style={{
        backgroundColor: isFocused ? 'var(--surface)' : 'var(--bg-2)',
        borderColor: isFocused ? 'var(--signal)' : 'var(--line-2)',
      }}
    >
      <PlusIcon
        className="w-4 h-4 flex-shrink-0 transition-colors"
        style={{ color: isFocused ? 'var(--signal)' : 'var(--ink-3)' }}
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
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ink-3)]"
        style={{ color: 'var(--ink)' }}
      />
      {text.trim() && (
        <button
          onClick={handleSubmit}
          className="std-btn std-btn--signal std-btn--sm h-7 px-3 flex-shrink-0"
        >
          Add
        </button>
      )}
    </div>
  );
});
QuickCapture.displayName = 'QuickCapture';

/* ── Single micro-entry (log line) ───────────────────────────── */
export const MicroEntryCard = memo(({ entry, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(entry.plainTextContent || '');
  const [showActions, setShowActions] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const touchStartRef = useRef(0);
  const lastTapRef = useRef(0);
  const longPressTimerRef = useRef(null);
  const cardRef = useRef(null);

  // Cleanup long-press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  // Click/touch outside to deselect
  useEffect(() => {
    if (!isSelected) return;
    const handleOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setIsSelected(false);
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [isSelected]);

  const openEditor = useCallback(() => {
    setEditText(entry.plainTextContent || '');
    setIsEditing(true);
    setIsSelected(false);
    setShowActions(false);
  }, [entry.plainTextContent]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = Date.now();
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      // Haptic feedback on supported devices
      if (navigator.vibrate) navigator.vibrate(30);
      setIsSelected(true);
      setShowActions(true);
    }, 450);
  }, [clearLongPressTimer]);

  const handleTouchEnd = useCallback(() => {
    const touchDuration = Date.now() - touchStartRef.current;
    const now = Date.now();

    // Double-tap to edit: two quick taps within 320ms
    if (touchDuration < 300) {
      if (now - lastTapRef.current < 320) {
        clearLongPressTimer();
        openEditor();
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;
    }

    clearLongPressTimer();
  }, [clearLongPressTimer, openEditor]);

  const handleSave = useCallback(() => {
    if (editText.trim()) {
      onEdit(entry._id, editText.trim());
    }
    setIsEditing(false);
    setIsSelected(false);
  }, [entry._id, editText, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(entry._id);
    setIsSelected(false);
  }, [entry._id, onDelete]);

  const time = new Date(entry.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isEditing) {
    return (
      <div className="flex items-start gap-2 px-3 py-2 rounded-[var(--r-btn)] border"
        style={{ borderColor: 'var(--signal)', backgroundColor: 'var(--surface)' }}>
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsEditing(false); }}
          autoFocus
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--ink)' }}
        />
        <button onClick={handleSave} className="p-1 rounded" style={{ color: 'var(--signal)' }}>
          <CheckIcon className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setIsEditing(false)} className="p-1 rounded" style={{ color: 'var(--ink-3)' }}>
          <Cross2Icon className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="group rounded-[var(--r-tag)] transition-all duration-150"
      onMouseEnter={() => !isSelected && setShowActions(true)}
      onMouseLeave={() => !isSelected && setShowActions(false)}
      onDoubleClick={openEditor}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={clearLongPressTimer}
      onTouchMove={clearLongPressTimer}
      style={{
        backgroundColor: isSelected ? 'var(--surface-2)' : undefined,
        border: isSelected ? '1px solid var(--signal)' : '1px solid transparent',
      }}
    >
      {/* Log line */}
      <div className="flex items-start gap-3 px-3 py-2">
        {/* Timeline bullet */}
        <div className="flex-shrink-0 mt-[7px]">
          <div
            className="w-1.5 h-1.5 rounded-full transition-colors"
            style={{ backgroundColor: isSelected ? 'var(--signal)' : 'var(--ink-3)' }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2.5">
            <span className="std-mono text-[10px] tabular-nums text-[var(--ink-3)] flex-shrink-0">
              {time}
            </span>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ink)' }}>
              {entry.plainTextContent}
            </p>
          </div>
          {(entry.linkedHabitId || entry.tags?.length > 0) && (
            <div className="flex items-center flex-wrap gap-1.5 mt-1 pl-[3.4rem]">
              {entry.linkedHabitId && (
                <span className="inline-flex items-center gap-1 std-mono text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-[var(--r-tag)] border border-[var(--line-2)]"
                  style={{ color: 'var(--ink-2)' }}>
                  <HabitIcon icon={entry.linkedHabitId.icon || 'Star'} size={11} /> {entry.linkedHabitId.name}
                </span>
              )}
              {entry.tags?.map(t => (
                <span key={t} className="std-mono text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-[var(--r-tag)] border border-[var(--line-2)]"
                  style={{ color: 'var(--ink-3)' }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Desktop hover actions */}
        {!isSelected && (
          <div className={`flex items-center gap-1 flex-shrink-0 transition-opacity duration-150 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={(e) => { e.stopPropagation(); openEditor(); }}
              className="p-1.5 rounded-md border hover:bg-[var(--surface-2)] transition-colors"
              style={{ color: 'var(--ink-2)', borderColor: 'var(--line-2)' }}
              aria-label="Edit"
            >
              <Pencil1Icon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="p-1.5 rounded-md border hover:bg-[var(--rose)]/10 hover:border-[var(--rose)]/30 transition-colors"
              style={{ color: 'var(--rose)', borderColor: 'var(--line-2)' }}
              aria-label="Delete"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Selection action bar — shown after long-press (touch) */}
      {isSelected && (
        <div className="flex items-center gap-2 px-3 pb-2.5">
          <button
            onClick={(e) => { e.stopPropagation(); openEditor(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[var(--r-btn)] std-mono text-[11px] uppercase tracking-wide border transition-colors"
            style={{
              color: 'var(--ink-2)',
              borderColor: 'var(--line-2)',
              backgroundColor: 'var(--surface)',
            }}
          >
            <Pencil1Icon className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[var(--r-btn)] std-mono text-[11px] uppercase tracking-wide border transition-colors"
            style={{
              color: 'var(--rose)',
              borderColor: 'color-mix(in srgb, var(--rose) 40%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--rose) 6%, transparent)',
            }}
          >
            <TrashIcon className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
});
MicroEntryCard.displayName = 'MicroEntryCard';

/* ── The captain's-log stack ─────────────────────────────────── */
export const MicroStack = memo(({ micros, onExpand, isExpanded, onEdit, onDelete }) => {
  if (!micros || micros.length === 0) return null;

  const visibleCount = isExpanded ? micros.length : Math.min(2, micros.length);
  const hiddenCount = micros.length - visibleCount;
  const visible = isExpanded ? micros : micros.slice(-2); // Show most recent when collapsed

  return (
    <div className="space-y-0.5">
      {/* Section label */}
      <div className="flex items-center justify-between px-3 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="std-kicker">Log · {micros.length}</span>
          <span className="hidden sm:inline std-mono text-[9px] uppercase tracking-wide"
            style={{ color: 'var(--ink-3)', opacity: 0.7 }}>
            double-click to edit · hold to select
          </span>
        </div>
        {micros.length > 2 && (
          <button
            onClick={onExpand}
            className="std-mono text-[10px] uppercase tracking-wide transition-colors hover:text-[var(--signal)]"
            style={{ color: 'var(--ink-3)' }}
          >
            {isExpanded ? 'Collapse' : `Show all ${micros.length}`}
          </button>
        )}
      </div>

      {/* Log entries */}
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
          className="w-full py-1 std-mono text-[10px] uppercase tracking-wide text-center transition-colors hover:text-[var(--ink-2)]"
          style={{ color: 'var(--ink-3)' }}
        >
          +{hiddenCount} more
        </button>
      )}
    </div>
  );
});
MicroStack.displayName = 'MicroStack';
