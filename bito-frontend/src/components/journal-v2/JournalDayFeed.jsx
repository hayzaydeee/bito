import React, { useState, useMemo, memo } from 'react';
import JournalMeta from '../journal/JournalMeta';
import { MicroStack, QuickCapture } from './MicroEntry';
import { journalV2Service } from '../../services/journalV2Service';

/* ═══════════════════════════════════════════════════════════════
   JournalDayFeed — Smart collapse view for a day's entries
   Shows longform expanded, micros collapsed into a stack.
   ═══════════════════════════════════════════════════════════════ */

const JournalDayFeed = ({
  // Data
  selectedDate,
  longform,
  micros,
  isLoading,
  // Longform editor
  editorSlot,   // React node — the BlockNote editor (rendered by parent)
  // Metadata
  mood,
  energy,
  tags,
  wordCount,
  saveStatus,
  onMoodChange,
  onEnergyChange,
  onAddTag,
  onRemoveTag,
  // Micro operations
  onAddMicro,
  onEditMicro,
  onDeleteMicro,
}) => {
  const [microsExpanded, setMicrosExpanded] = useState(false);

  // Formatted heading date
  const headingDate = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    if (isToday) return 'Today';

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();

    if (isYesterday) return 'Yesterday';

    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, [selectedDate]);

  const fullDate = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[var(--color-text-tertiary)] border-t-[var(--color-brand-500)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header section ──────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 sm:px-10 pt-6 pb-3">
        {/* Date heading */}
        <h1 className="text-2xl sm:text-3xl font-garamond font-bold text-[var(--color-text-primary)] leading-tight">
          {headingDate}
        </h1>
        {headingDate !== fullDate && (
          <p className="text-xs font-spartan mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            {fullDate}
          </p>
        )}

        {/* Metadata strip */}
        <div className="mt-3">
          <JournalMeta
            mood={mood}
            energy={energy}
            tags={tags}
            onMoodChange={onMoodChange}
            onEnergyChange={onEnergyChange}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
          />
        </div>
      </div>

      {/* ── Content area ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Quick capture bar */}
        <div className="px-6 sm:px-10 pb-4">
          <QuickCapture
            onSubmit={(text) => onAddMicro(text)}
            placeholder="Quick thought..."
          />
        </div>

        {/* Micro-entries stack (smart collapse) */}
        {micros.length > 0 && (
          <div className="px-6 sm:px-10 pb-4">
            <MicroStack
              micros={micros}
              isExpanded={microsExpanded}
              onExpand={() => setMicrosExpanded(!microsExpanded)}
              onEdit={onEditMicro}
              onDelete={onDeleteMicro}
            />
          </div>
        )}

        {/* Divider between micros and longform */}
        {micros.length > 0 && (
          <div className="px-6 sm:px-10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border-primary)' }} />
              <span className="text-[10px] font-spartan font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-tertiary)' }}>
                Long-form
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border-primary)' }} />
            </div>
          </div>
        )}

        {/* Longform editor */}
        <div className="px-6 sm:px-10 pb-6">
          <div className="max-w-2xl mx-auto rounded-xl border p-4 sm:p-6"
            style={{
              backgroundColor: 'var(--color-surface-primary)',
              borderColor: 'var(--color-border-primary)',
            }}>
            {editorSlot}
          </div>
        </div>
      </div>

      {/* ── Footer status bar ───────────────────────────────── */}
      <div className="flex-shrink-0 border-t px-6 sm:px-10 py-2 flex items-center justify-between text-xs font-spartan"
        style={{ borderColor: 'var(--color-border-primary)', color: 'var(--color-text-tertiary)' }}>
        <div className="flex items-center gap-3">
          <span>{wordCount} words</span>
          {micros.length > 0 && (
            <>
              <span>·</span>
              <span>{micros.length} quick note{micros.length !== 1 ? 's' : ''}</span>
            </>
          )}
          <span>·</span>
          <span>{journalV2Service.getReadingTime(wordCount)} min read</span>
        </div>
        <div className="flex items-center gap-1.5">
          {saveStatus === 'saving' && (
            <>
              <div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] animate-pulse" />
              <span>Saving…</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
              <span>Saved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <div className="w-2 h-2 rounded-full bg-[var(--color-error)]" />
              <span className="text-[var(--color-error)]">Error saving</span>
            </>
          )}
          {saveStatus === 'idle' && (
            <span style={{ color: 'var(--color-text-tertiary)' }}>Ready</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(JournalDayFeed);
