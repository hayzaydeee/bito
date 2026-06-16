import React, { useState, memo } from 'react';
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

  // Dateline for the spread masthead
  const _d = new Date(selectedDate + 'T12:00:00');
  const _now = new Date();
  const _isToday = _d.toDateString() === _now.toDateString();
  const _yest = new Date(_now);
  _yest.setDate(_yest.getDate() - 1);
  const _isYesterday = _d.toDateString() === _yest.toDateString();
  const dateKicker = `${_d.toLocaleDateString('en-US', { weekday: 'long' })} · ${_d.getFullYear()}`;
  const dateTitle = _isToday
    ? 'Today'
    : _isYesterday
      ? 'Yesterday'
      : _d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[var(--line-2)] border-t-[var(--signal)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Centralized content column ─────────────────────── */}
      <div className="flex-shrink-0 pt-2 pb-3 max-w-[740px] mx-auto w-full">
        {/* Dateline masthead */}
        <div className="mb-4">
          <p className="std-kicker mb-1.5">{dateKicker}</p>
          <h2 className="std-display text-[30px] sm:text-[36px] font-bold leading-[0.95] text-[var(--ink)]">
            {dateTitle}
          </h2>
        </div>
        <div data-tour="journal-mood-energy">
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
      <div className="flex-1 overflow-y-auto journal-v2-content-scroll">
        <div className="max-w-[740px] mx-auto w-full">
        {/* Quick capture bar */}
        <div className="pb-4" data-tour="journal-quick-capture">
          <QuickCapture
            onSubmit={(text) => onAddMicro(text)}
            placeholder="Quick thought..."
          />
        </div>

        {/* Micro-entries stack (smart collapse) */}
        {micros.length > 0 && (
          <div className="pb-4">
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
          <div className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--line-2)' }} />
              <span className="std-kicker">Long-form</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--line-2)' }} />
            </div>
          </div>
        )}

        {/* Longform editor — manuscript column */}
        <div className="pb-6">
          <div className="relative pl-5 sm:pl-6" data-tour="journal-editor">
            <span className="absolute left-0 top-1 bottom-1 w-px" style={{ background: 'var(--line-2)' }} />
            <div className="pr-1 sm:pr-2 py-1">
              {editorSlot}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* ── Footer status bar ───────────────────────────────── */}
      <div className="flex-shrink-0 border-t py-2 max-w-[740px] mx-auto w-full flex items-center justify-between grp-mono text-[10px] uppercase tracking-wider"
        data-tour="journal-status-bar"
        style={{ borderColor: 'var(--line-2)', color: 'var(--ink-3)' }}>
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
              <div className="w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse" />
              <span>Saving…</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <div className="w-2 h-2 rounded-full bg-[var(--signal)]" />
              <span>Saved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <div className="w-2 h-2 rounded-full bg-[var(--rose)]" />
              <span style={{ color: 'var(--rose)' }}>Error saving</span>
            </>
          )}
          {saveStatus === 'idle' && (
            <span style={{ color: 'var(--ink-3)' }}>Ready</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(JournalDayFeed);
