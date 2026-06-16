import React, { useState, useEffect, useCallback, memo } from 'react';
import { ArrowRightIcon } from '@radix-ui/react-icons';
import { journalV2Service } from '../../services/journalV2Service';
import {
  SmileyAngry, SmileySad, SmileyMeh, Smiley, SmileyWink,
  BatteryEmpty, BatteryLow, BatteryMedium, BatteryHigh, BatteryFull,
} from '@phosphor-icons/react';

/* ═══════════════════════════════════════════════════════════════
   JournalEntryList — "The Ledger / Index"
   A logbook table-of-contents: mono № rows (date, mood/energy pips,
   word count, preview), ledger-line hairlines. DRILL editorial.
   ═══════════════════════════════════════════════════════════════ */

const PAGE_SIZE = 10;

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

const EntryRow = memo(({ entry, onSelect, number }) => {
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

  const formattedDate = isToday
    ? 'Today'
    : isYesterday
      ? 'Yesterday'
      : date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });

  const mood = entry.mood ? MOOD_ICONS[entry.mood - 1] : null;
  const energy = entry.energy ? ENERGY_ICONS[entry.energy - 1] : null;

  return (
    <button
      onClick={() => onSelect(dateStr)}
      className="group w-full text-left flex items-baseline gap-4 px-2 py-3.5 border-b border-[var(--line)] hover:bg-[var(--surface-2)] transition-colors"
    >
      {/* Ledger number */}
      <span className="std-mono text-[11px] tabular-nums text-[var(--ink-3)] w-12 flex-shrink-0 pt-0.5">
        №{number != null ? String(number).padStart(2, '0') : '—'}
      </span>

      <div className="flex-1 min-w-0">
        {/* Dateline + pips + words */}
        <div className="flex items-baseline gap-2.5">
          <h3 className="std-display text-[15px] font-bold text-[var(--ink)] flex-shrink-0">
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
            <span className="ml-auto std-mono text-[10.5px] text-[var(--ink-3)] flex-shrink-0 self-center">
              {entry.wordCount} words
            </span>
          )}
          <ArrowRightIcon className="w-3.5 h-3.5 text-[var(--ink-3)] flex-shrink-0 self-center opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </div>

        {/* Preview */}
        {entry.preview && (
          <p className="mt-1 text-[13px] text-[var(--ink-2)] leading-relaxed line-clamp-1">
            {entry.preview}
          </p>
        )}

        {/* Tags */}
        {entry.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
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
EntryRow.displayName = 'EntryRow';

const JournalEntryList = ({ onSelectDate }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const loadPage = useCallback(async (p) => {
    setLoading(true);
    try {
      const data = await journalV2Service.getEntries({ page: p, limit: PAGE_SIZE });
      setEntries(data.entries || []);
      setPagination(data.pagination);
      setPage(p);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const total = pagination?.total ?? entries.length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="max-w-3xl mx-auto w-full flex flex-col h-full">
        {/* Ledger header */}
        <div className="flex-shrink-0 pt-2 pb-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="std-display text-lg font-bold text-[var(--ink)]">
              All entries
            </h2>
            <span className="std-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
              {pagination
                ? `${total} ${total === 1 ? 'entry' : 'entries'}`
                : 'Loading…'}
            </span>
          </div>
          <hr className="std-rule mt-2" />
        </div>

        {/* Ledger rows */}
        <div className="flex-1 overflow-y-auto pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-[var(--line-2)] border-t-[var(--signal)] rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
              <p className="std-display text-base font-bold text-[var(--ink)]">
                No entries yet
              </p>
              <p className="std-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                Start writing today — entries log here
              </p>
            </div>
          ) : (
            entries.map((entry, idx) => (
              <EntryRow
                key={entry._id}
                entry={entry}
                onSelect={onSelectDate}
                number={total - ((page - 1) * PAGE_SIZE + idx)}
              />
            ))
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-5">
              <button
                onClick={() => loadPage(page - 1)}
                disabled={page <= 1}
                className="std-btn std-btn--sm disabled:opacity-30"
              >
                Prev
              </button>
              <span className="std-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                Page {page} / {pagination.pages}
              </span>
              <button
                onClick={() => loadPage(page + 1)}
                disabled={page >= pagination.pages}
                className="std-btn std-btn--sm disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalEntryList;
