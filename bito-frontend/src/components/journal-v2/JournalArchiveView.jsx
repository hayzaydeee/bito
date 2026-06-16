import React, { useState, useEffect, useCallback, memo } from 'react';
import { journalV2Service } from '../../services/journalV2Service';
import { ArrowLeftIcon, PlusIcon, MinusIcon } from '@radix-ui/react-icons';
import {
  SmileyAngry, SmileySad, SmileyMeh, Smiley, SmileyWink,
  BatteryEmpty, BatteryLow, BatteryMedium, BatteryHigh, BatteryFull,
} from '@phosphor-icons/react';

/* ═══════════════════════════════════════════════════════════════
   JournalArchiveView — "The Stacks"
   Read-only ledger of legacy journal entries. DRILL editorial:
   mono № indices, hairline-framed cards, serif datelines.
   ═══════════════════════════════════════════════════════════════ */

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

const ArchiveEntry = memo(({ entry, number }) => {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(entry.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Extract plain text for preview
  const plainText = entry.plainTextContent || '';
  const preview = plainText.length > 200 ? plainText.slice(0, 200) + '…' : plainText;

  const mood = entry.mood ? MOOD_ICONS[entry.mood - 1] : null;
  const energy = entry.energy ? ENERGY_ICONS[entry.energy - 1] : null;

  return (
    <div className="std-card p-0 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-baseline gap-4 px-4 py-3.5 text-left hover:bg-[var(--surface-2)] transition-colors"
      >
        <span className="std-mono text-[11px] tabular-nums text-[var(--ink-3)] w-10 flex-shrink-0 pt-0.5">
          №{number != null ? String(number).padStart(2, '0') : '—'}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2.5">
            <h3 className="std-display text-[15px] font-bold text-[var(--ink)] flex-shrink-0">
              {date}
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
          </div>

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

          {/* Collapsed preview */}
          {!expanded && preview && (
            <p className="mt-1.5 text-[13px] text-[var(--ink-2)] leading-relaxed line-clamp-2">
              {preview}
            </p>
          )}
        </div>

        {expanded
          ? <MinusIcon className="w-4 h-4 flex-shrink-0 self-center text-[var(--ink-3)]" />
          : <PlusIcon className="w-4 h-4 flex-shrink-0 self-center text-[var(--ink-3)]" />
        }
      </button>

      {/* Expanded content — manuscript column */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-[var(--line)]">
          <p className="std-display text-[15px] text-[var(--ink)] leading-[1.75] whitespace-pre-wrap">
            {plainText || 'No text content'}
          </p>
        </div>
      )}
    </div>
  );
});
ArchiveEntry.displayName = 'ArchiveEntry';

const JournalArchiveView = ({ onClose }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const loadPage = useCallback(async (p) => {
    setLoading(true);
    try {
      const data = await journalV2Service.getArchive({ page: p, limit: 10 });
      setEntries(data.entries || []);
      setPagination(data.pagination);
      setPage(p);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPage(1); }, [loadPage]);

  const total = pagination?.total ?? entries.length;

  return (
    <div className="std h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 sm:px-10 pt-6 pb-4">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="std-kicker">The Stacks · Archive</p>
              <h2 className="std-display text-2xl font-bold text-[var(--ink)] mt-1">
                Journal Archive
              </h2>
              <p className="std-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)] mt-1">
                Read-only · previous journal format
              </p>
            </div>
            <button
              onClick={onClose}
              className="std-btn std-btn--sm flex items-center gap-1.5 flex-shrink-0"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              Back to Journal
            </button>
          </div>
          <hr className="std-rule mt-4" />
        </div>
      </div>

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-10 pb-6">
        <div className="max-w-3xl mx-auto w-full space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-[var(--line-2)] border-t-[var(--signal)] rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
              <p className="std-display text-base font-bold text-[var(--ink)]">
                No archived entries found
              </p>
              <p className="std-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                The stacks are empty
              </p>
            </div>
          ) : (
            entries.map((entry, idx) => (
              <ArchiveEntry
                key={entry._id}
                entry={entry}
                number={total - ((page - 1) * 10 + idx)}
              />
            ))
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
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

export default JournalArchiveView;
