import React, { useState, useEffect, useCallback, memo } from 'react';
import { ArrowRight, PencilSimpleLine } from '@phosphor-icons/react';
import { journalV2Service } from '../../services/journalV2Service';
import { QuickCapture } from './MicroEntry';

/* ═══════════════════════════════════════════════════════════════
   PeriodicalCards — "The Periodical" layout on Journal Home
   Time-horizon cards: Today / This Week / This Month / Archive.
   Each is a clickable card that opens into its respective view.
   ═══════════════════════════════════════════════════════════════ */

const TodayIssueCard = ({ wordCount, microCount, mood, energy, hasContent, onOpen, onAddMicro }) => {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div
      className="std-card std-card-hover cursor-pointer journal-home-periodical-today"
      style={{ borderLeft: '3px solid var(--signal)' }}
    >
      <div className="p-5 sm:p-6">
        <p className="std-kicker text-[var(--signal)] mb-2">Today</p>
        <h3 className="std-display text-[22px] sm:text-[26px] font-bold leading-[0.95] text-[var(--ink)] mb-1">
          {weekday}
        </h3>
        <p className="std-mono text-[10px] text-[var(--ink-3)] tracking-wider uppercase mb-4">
          {dateStr}
        </p>

        {/* Status */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {hasContent ? (
            <>
              <span className="std-mono text-[10px] text-[var(--ink-2)] tracking-wider uppercase">
                {wordCount} words
              </span>
              {microCount > 0 && (
                <>
                  <span className="text-[var(--ink-3)]">·</span>
                  <span className="std-mono text-[10px] text-[var(--ink-2)] tracking-wider uppercase">
                    {microCount} note{microCount !== 1 ? 's' : ''}
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="std-mono text-[10px] text-[var(--ink-3)] tracking-wider uppercase">
              Not started
            </span>
          )}
        </div>

        {/* Quick capture */}
        <div className="mb-4">
          <QuickCapture onSubmit={onAddMicro} placeholder="Quick thought..." />
        </div>

        <button onClick={onOpen} className="std-btn std-btn--signal std-btn--sm">
          <PencilSimpleLine size={14} weight="bold" />
          {hasContent ? 'Continue' : 'Start writing'}
        </button>
      </div>
    </div>
  );
};

const WeekCard = ({ entries, onOpen }) => {
  // Compute this week's stats from recent entries
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday start
  weekStart.setHours(0, 0, 0, 0);

  const weekEntries = entries.filter(e => {
    const d = new Date(e.date);
    return d >= weekStart;
  });

  const daysWritten = new Set(weekEntries.map(e =>
    new Date(e.date).toISOString().split('T')[0]
  )).size;

  const totalWords = weekEntries.reduce((sum, e) => sum + (e.wordCount || 0), 0);

  return (
    <button
      onClick={onOpen}
      className="std-card std-card-hover text-left w-full group"
    >
      <div className="p-5 sm:p-6">
        <p className="std-kicker text-[var(--ink-3)] mb-2">This Week</p>
        <div className="space-y-1.5 mb-4">
          <p className="std-display text-[18px] font-bold text-[var(--ink)]">
            {daysWritten}/7
            <span className="text-[14px] font-normal text-[var(--ink-2)] ml-1.5">days written</span>
          </p>
          <p className="std-mono text-[10px] text-[var(--ink-3)] tracking-wider uppercase">
            {totalWords.toLocaleString()} words total
          </p>
        </div>
        <span className="std-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider group-hover:text-[var(--signal)] transition-colors flex items-center gap-1">
          View week <ArrowRight size={11} weight="bold" />
        </span>
      </div>
    </button>
  );
};

const MonthCard = ({ entries, onOpen }) => {
  const now = new Date();
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthEntries = entries.filter(e => {
    const d = new Date(e.date);
    return d >= monthStart;
  });

  const totalEntries = monthEntries.length;
  const totalWords = monthEntries.reduce((sum, e) => sum + (e.wordCount || 0), 0);

  return (
    <button
      onClick={onOpen}
      className="std-card std-card-hover text-left w-full group"
    >
      <div className="p-5 sm:p-6">
        <p className="std-kicker text-[var(--ink-3)] mb-2">This Month</p>
        <div className="space-y-1.5 mb-4">
          <p className="std-display text-[18px] font-bold text-[var(--ink)]">
            {monthName}
          </p>
          <p className="std-mono text-[10px] text-[var(--ink-3)] tracking-wider uppercase">
            {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'} · {totalWords.toLocaleString()} words
          </p>
        </div>
        <span className="std-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider group-hover:text-[var(--signal)] transition-colors flex items-center gap-1">
          View month <ArrowRight size={11} weight="bold" />
        </span>
      </div>
    </button>
  );
};

const ArchiveCard = ({ totalEntries, onOpen }) => (
  <button
    onClick={onOpen}
    className="std-card std-card-hover text-left w-full group"
  >
    <div className="p-5 sm:p-6">
      <p className="std-kicker text-[var(--ink-3)] mb-2">Archive</p>
      <div className="space-y-1.5 mb-4">
        <p className="std-display text-[18px] font-bold text-[var(--ink)]">
          All entries
        </p>
        <p className="std-mono text-[10px] text-[var(--ink-3)] tracking-wider uppercase">
          {totalEntries} total · Search, browse, reflect
        </p>
      </div>
      <span className="std-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider group-hover:text-[var(--signal)] transition-colors flex items-center gap-1">
        Open archive <ArrowRight size={11} weight="bold" />
      </span>
    </div>
  </button>
);

const PeriodicalCards = ({
  wordCount,
  microCount,
  mood,
  energy,
  onOpenToday,
  onOpenList,
  onOpenStream,
  onOpenArchive,
  onAddMicro,
}) => {
  const [allEntries, setAllEntries] = useState([]);
  const [totalEntries, setTotalEntries] = useState(0);

  useEffect(() => {
    // Load enough entries to compute week/month stats
    journalV2Service.getEntries({ page: 1, limit: 40 })
      .then(data => {
        setAllEntries(data.entries || []);
        setTotalEntries(data.pagination?.total ?? 0);
      })
      .catch(() => {});
  }, []);

  const hasContent = wordCount > 0 || microCount > 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Today — spans full width on mobile, left column on desktop */}
      <TodayIssueCard
        wordCount={wordCount}
        microCount={microCount}
        mood={mood}
        energy={energy}
        hasContent={hasContent}
        onOpen={onOpenToday}
        onAddMicro={onAddMicro}
      />
      <WeekCard entries={allEntries} onOpen={onOpenStream} />
      <MonthCard entries={allEntries} onOpen={onOpenList} />
      <ArchiveCard totalEntries={totalEntries} onOpen={onOpenArchive} />
    </div>
  );
};

export default memo(PeriodicalCards);
