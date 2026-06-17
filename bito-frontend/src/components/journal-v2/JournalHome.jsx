import React, { useState, useEffect, useCallback, memo } from 'react';
import { Notebook, SquaresFour, Lock, LockOpen } from '@phosphor-icons/react';
import TodaysDeskCard from './TodaysDeskCard';
import ReadingRoomCard from './ReadingRoomCard';
import PeriodicalCards from './PeriodicalCards';
import { journalV2Service } from '../../services/journalV2Service';

/* ═══════════════════════════════════════════════════════════════
   JournalHome — the landing page for the Journal.
   Two layouts available:
     • "desk" (default) — Direction B: Today's Desk + Reading Room
     • "periodical"     — Direction A: time-horizon cards grid
   Layout preference stored in localStorage.
   ═══════════════════════════════════════════════════════════════ */

const LS_LAYOUT_KEY = 'bito_journal_home_layout';

const JournalHome = ({
  // Today's data (from useJournal hook)
  wordCount,
  mood,
  energy,
  micros,
  selectedDate,
  // Actions
  onOpenToday,
  onOpenYesterday,
  onOpenList,
  onOpenStream,

  onOpenArchive,
  onSelectDate,
  onAddMicro,
  // Intelligence
  journalAI,
  onOpenIntelligence,
}) => {
  const [homeLayout, setHomeLayout] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_LAYOUT_KEY);
      if (saved && ['desk', 'periodical'].includes(saved)) return saved;
    } catch { /* ignore */ }
    return 'desk';
  });

  // Check if yesterday has content
  const [yesterdayHasContent, setYesterdayHasContent] = useState(false);
  useEffect(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    journalV2Service.getDay(yStr)
      .then(data => {
        const has = !!(data?.longform?.wordCount > 0 || data?.micros?.length > 0);
        setYesterdayHasContent(has);
      })
      .catch(() => {});
  }, []);

  // Overall stats
  const [stats, setStats] = useState(null);
  useEffect(() => {
    journalV2Service.getStats()
      .then(data => setStats(data?.stats || null))
      .catch(() => {});
  }, []);

  const handleLayoutChange = useCallback((layout) => {
    setHomeLayout(layout);
    try { localStorage.setItem(LS_LAYOUT_KEY, layout); } catch { /* ignore */ }
  }, []);

  const microCount = micros?.length || 0;
  const aiActive = journalAI?.insightNudges || journalAI?.contentAnalysis || journalAI?.weeklySummaries;

  return (
    <div className="std px-4 sm:px-8 py-7 sm:py-10 h-full flex flex-col min-h-0 space-y-0">
      <div className="max-w-5xl mx-auto flex-shrink-0 space-y-8 pb-8 w-full">

        {/* ── Masthead ──────────────────────────────── */}
        <div>
          <div className="flex items-end justify-between gap-4 flex-wrap mb-1">
            <div className="min-w-0">
              <p className="std-kicker text-[var(--signal)] mb-1.5">The Ledger</p>
              <h1 className="std-display text-4xl sm:text-5xl font-bold text-[var(--ink)] leading-none">
                Journal
              </h1>
            </div>

            {/* Right: layout toggle + intelligence */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Layout toggle: Desk ↔ Periodical */}
              <div className="flex items-center rounded-[10px] border border-[var(--line-2)] bg-[var(--bg-2)] p-0.5">
                {[
                  { id: 'desk', Icon: Notebook, label: 'Writing Desk' },
                  { id: 'periodical', Icon: SquaresFour, label: 'Periodical' },
                ].map(({ id, Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => handleLayoutChange(id)}
                    className="p-1.5 rounded-[7px] transition-colors"
                    style={{
                      backgroundColor: homeLayout === id ? 'var(--surface-2)' : 'transparent',
                      color: homeLayout === id ? 'var(--signal)' : 'var(--ink-3)',
                    }}
                    aria-label={label}
                    title={label}
                  >
                    <Icon size={16} weight={homeLayout === id ? 'fill' : 'regular'} />
                  </button>
                ))}
              </div>

              {/* Intelligence button */}
              <button
                onClick={onOpenIntelligence}
                className="std-btn std-btn--signal std-btn--sm"
                aria-label="Journal Intelligence settings"
              >
                {aiActive
                  ? <LockOpen size={14} weight="bold" />
                  : <Lock size={14} weight="bold" />
                }
                Intelligence
              </button>
            </div>
          </div>

          {/* Stats strip */}
          {stats && (
            <p className="std-mono text-[11px] text-[var(--ink-3)] mt-2 tracking-wider uppercase">
              {stats.totalEntries || 0} Entries
              {stats.totalWords ? ` · ${stats.totalWords.toLocaleString()} Words` : ''}
              {stats.uniqueDays ? ` · ${stats.uniqueDays} Days Journaled` : ''}
            </p>
          )}

          <div className="std-rule mt-4" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-20 scrollbar-hide -mx-4 px-4 sm:-mx-8 sm:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* ── Home Layout ──────────────────────────── */}
          {homeLayout === 'periodical' ? (
            <PeriodicalCards
              wordCount={wordCount}
              microCount={microCount}
              mood={mood}
              energy={energy}
              onOpenToday={onOpenToday}
              onOpenList={onOpenList}
              onOpenStream={onOpenStream}
              onOpenArchive={onOpenArchive}
              onAddMicro={onAddMicro}
            />
          ) : (
            <div className="space-y-6">
              <TodaysDeskCard
                wordCount={wordCount}
                mood={mood}
                energy={energy}
                microCount={microCount}
                hasYesterday={yesterdayHasContent}
                onOpenToday={onOpenToday}
                onOpenYesterday={onOpenYesterday}
                onAddMicro={onAddMicro}
              />
              <ReadingRoomCard
                onOpenList={onOpenList}
                onOpenStream={onOpenStream}

                onOpenArchive={onOpenArchive}
                onSelectDate={onSelectDate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(JournalHome);
