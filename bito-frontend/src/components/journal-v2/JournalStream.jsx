import React, { useState, useEffect, useCallback, memo } from 'react';
import { journalV2Service } from '../../services/journalV2Service';
import {
  SmileyAngry, SmileySad, SmileyMeh, Smiley, SmileyWink,
  BatteryEmpty, BatteryLow, BatteryMedium, BatteryHigh, BatteryFull,
} from '@phosphor-icons/react';

/* ═══════════════════════════════════════════════════════════════
   JournalStream — "The Ledger / Timeline"
   An editorial reading feed: a continuous timeline spine with dated
   nodes and serif excerpts, newest first. Read mode (vs the Ledger's
   scan table). Click an entry to open its day spread.
   ═══════════════════════════════════════════════════════════════ */

const PAGE_SIZE = 8;

const MOOD_ICONS = [
  { Icon: SmileyAngry, color: '#ef4444', label: 'Awful' },
  { Icon: SmileySad,   color: '#f97316', label: 'Bad' },
  { Icon: SmileyMeh,   color: '#eab308', label: 'Okay' },
  { Icon: Smiley,      color: '#22c55e', label: 'Good' },
  { Icon: SmileyWink,  color: '#6366f1', label: 'Great' },
];

const ENERGY_ICONS = [
  { Icon: BatteryEmpty,  color: '#ef4444', label: 'Drained' },
  { Icon: BatteryLow,    color: '#f97316', label: 'Low' },
  { Icon: BatteryMedium, color: '#eab308', label: 'Moderate' },
  { Icon: BatteryHigh,   color: '#22c55e', label: 'High' },
  { Icon: BatteryFull,   color: '#6366f1', label: 'Peak' },
];

const StreamEntry = memo(({ entry, onSelect, isLast }) => {
  const date = new Date(entry.date);
  const dateStr = date.toISOString().split('T')[0];

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const formattedDate = isToday
    ? 'Today'
    : isYesterday
      ? 'Yesterday'
      : date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });

  const mood = entry.mood ? MOOD_ICONS[entry.mood - 1] : null;
  const energy = entry.energy ? ENERGY_ICONS[entry.energy - 1] : null;

  return (
    <button
      onClick={() => onSelect(dateStr)}
      className="group w-full text-left flex gap-4"
    >
      {/* Timeline spine */}
      <div className="relative flex-shrink-0 flex flex-col items-center w-2.5">
        <span
          className="w-2.5 h-2.5 rounded-full mt-1.5 transition-colors"
          style={{ background: 'var(--ink-3)' }}
        />
        {!isLast && <span className="w-px flex-1 mt-1.5 mb-1" style={{ background: 'var(--line-2)' }} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-8">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="std-mono text-[10px] tracking-wider text-[var(--ink-3)]">{weekday}</span>
          <h3 className="std-display text-[19px] font-bold text-[var(--ink)] leading-none group-hover:text-[var(--signal)] transition-colors">
            {formattedDate}
          </h3>
          {mood && (
            <span className="flex-shrink-0 self-center" title={`Mood: ${mood.label}`}>
              <mood.Icon size={13} weight="fill" color={mood.color} />
            </span>
          )}
          {energy && (
            <span className="flex-shrink-0 self-center" title={`Energy: ${energy.label}`}>
              <energy.Icon size={13} weight="fill" color={energy.color} />
            </span>
          )}
          {entry.wordCount > 0 && (
            <span className="ml-auto std-mono text-[10px] text-[var(--ink-3)] flex-shrink-0 self-center">
              {entry.wordCount} words
            </span>
          )}
        </div>

        {entry.preview && (
          <p
            className="mt-2.5 text-[15px] leading-relaxed text-[var(--ink-2)] line-clamp-3"
            style={{ fontFamily: 'var(--f-display)' }}
          >
            {entry.preview}
          </p>
        )}

        {entry.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {entry.tags.map((t) => (
              <span
                key={t}
                className="std-mono text-[9px] uppercase tracking-wide text-[var(--ink-3)] border border-[var(--line-2)] px-1.5 py-0.5 rounded-[var(--r-tag)]"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
});
StreamEntry.displayName = 'StreamEntry';

const JournalStream = ({ onSelectDate }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const loadPage = useCallback(async (p, append) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const data = await journalV2Service.getEntries({ page: p, limit: PAGE_SIZE });
      setEntries((prev) => (append ? [...prev, ...(data.entries || [])] : data.entries || []));
      setPagination(data.pagination);
      setPage(p);
    } catch {
      if (!append) setEntries([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1, false);
  }, [loadPage]);

  const total = pagination?.total ?? entries.length;
  const hasMore = pagination && page < pagination.pages;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="max-w-3xl mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 pt-2 pb-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="std-display text-lg font-bold text-[var(--ink)]">Timeline</h2>
            <span className="std-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
              {pagination ? `${total} ${total === 1 ? 'entry' : 'entries'} · newest first` : 'Loading…'}
            </span>
          </div>
          <hr className="std-rule mt-2" />
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto pt-5 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-[var(--line-2)] border-t-[var(--signal)] rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
              <p className="std-display text-base font-bold text-[var(--ink)]">Nothing to read yet</p>
              <p className="std-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                Your written days will stream here
              </p>
            </div>
          ) : (
            <>
              {entries.map((entry, idx) => (
                <StreamEntry
                  key={entry._id}
                  entry={entry}
                  onSelect={onSelectDate}
                  isLast={idx === entries.length - 1}
                />
              ))}

              {hasMore && (
                <div className="flex justify-center pt-1">
                  <button
                    onClick={() => loadPage(page + 1, true)}
                    disabled={loadingMore}
                    className="std-btn std-btn--sm disabled:opacity-40"
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalStream;
