import React, { useState, useEffect, useCallback, memo } from 'react';
import { journalV2Service } from '../../services/journalV2Service';

/* ═══════════════════════════════════════════════════════════════
   JournalEntryList — Paginated list of V2 longform entries
   ═══════════════════════════════════════════════════════════════ */

const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😊'];
const ENERGY_EMOJI = ['🪫', '😴', '⚡', '🔋', '🚀'];

const EntryRow = memo(({ entry, onSelect }) => {
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

  return (
    <button
      onClick={() => onSelect(dateStr)}
      className="w-full text-left rounded-xl border p-4 transition-all duration-200 hover:bg-[var(--color-surface-hover)] active:scale-[0.99]"
      style={{
        backgroundColor: 'var(--color-surface-primary)',
        borderColor: 'var(--color-border-primary)',
      }}
    >
      {/* Top row: date + metadata */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3
            className="text-sm font-spartan font-semibold truncate"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {formattedDate}
          </h3>
          {entry.mood && (
            <span className="text-xs flex-shrink-0" title={`Mood: ${entry.mood}/5`}>
              {MOOD_EMOJI[entry.mood - 1]}
            </span>
          )}
          {entry.energy && (
            <span className="text-xs flex-shrink-0" title={`Energy: ${entry.energy}/5`}>
              {ENERGY_EMOJI[entry.energy - 1]}
            </span>
          )}
        </div>
        {entry.wordCount > 0 && (
          <span
            className="text-[10px] font-spartan flex-shrink-0"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {entry.wordCount} words
          </span>
        )}
      </div>

      {/* Preview */}
      {entry.preview && (
        <p
          className="mt-1.5 text-xs font-spartan leading-relaxed line-clamp-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {entry.preview}
        </p>
      )}

      {/* Tags */}
      {entry.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {entry.tags.map((t) => (
            <span
              key={t}
              className="text-[10px] font-spartan px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
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
      const data = await journalV2Service.getEntries({ page: p, limit: 10 });
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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-1 pt-2 pb-3">
        <h2
          className="text-lg font-garamond font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          All Entries
        </h2>
        <p
          className="text-xs font-spartan mt-0.5"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {pagination
            ? `${pagination.total} longform ${pagination.total === 1 ? 'entry' : 'entries'}`
            : 'Loading...'}
        </p>
      </div>

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto px-1 pb-6 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[var(--color-text-tertiary)] border-t-[var(--color-brand-500)] rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p
              className="text-sm font-spartan"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              No longform entries yet.
            </p>
            <p
              className="text-xs font-spartan"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Start writing today — your entries will appear here.
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <EntryRow key={entry._id} entry={entry} onSelect={onSelectDate} />
          ))
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => loadPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-xs font-spartan font-semibold transition-colors disabled:opacity-30"
              style={{
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-surface-elevated)',
              }}
            >
              Previous
            </button>
            <span
              className="text-xs font-spartan"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => loadPage(page + 1)}
              disabled={page >= pagination.pages}
              className="px-3 py-1.5 rounded-lg text-xs font-spartan font-semibold transition-colors disabled:opacity-30"
              style={{
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-surface-elevated)',
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalEntryList;
