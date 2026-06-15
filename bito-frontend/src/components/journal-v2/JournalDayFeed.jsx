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
      <div className="flex-shrink-0 pt-4 pb-3 max-w-[740px] mx-auto w-full" data-tour="journal-mood-energy">
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

        {/* Longform editor */}
        <div className="pb-6">
          <div className="std-card overflow-hidden" data-tour="journal-editor">
            <div className="pl-0 pr-4 py-4 sm:pr-6 sm:py-6">
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
