import React, { useState, useEffect, useCallback, memo } from 'react';
import { journalV2Service } from '../../services/journalV2Service';
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';

/* ═══════════════════════════════════════════════════════════════
   JournalArchiveView — Read-only view of legacy journal entries
   ═══════════════════════════════════════════════════════════════ */

const ArchiveEntry = memo(({ entry }) => {
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

  const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😊'];
  const ENERGY_EMOJI = ['🪫', '😴', '⚡', '🔋', '🚀'];

  return (
    <div
      className="rounded-xl border p-4 transition-all duration-200"
      style={{
        backgroundColor: 'var(--color-surface-primary)',
        borderColor: 'var(--color-border-primary)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h3 className="text-sm font-spartan font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {date}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {entry.mood && (
              <span className="text-xs">{MOOD_EMOJI[entry.mood - 1]}</span>
            )}
            {entry.energy && (
              <span className="text-xs">{ENERGY_EMOJI[entry.energy - 1]}</span>
            )}
            {entry.wordCount > 0 && (
              <span className="text-[10px] font-spartan" style={{ color: 'var(--color-text-tertiary)' }}>
                {entry.wordCount} words
              </span>
            )}
            {entry.tags?.map(t => (
              <span key={t} className="text-[10px] font-spartan px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-tertiary)' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
        {expanded
          ? <ChevronUpIcon className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
          : <ChevronDownIcon className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
        }
      </button>

      {/* Content */}
      {expanded ? (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border-primary)' }}>
          <p className="text-sm font-spartan leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--color-text-primary)' }}>
            {plainText || 'No text content'}
          </p>
        </div>
      ) : (
        preview && (
          <p className="mt-2 text-xs font-spartan leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}>
            {preview}
          </p>
        )
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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 sm:px-10 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-garamond font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Journal Archive
          </h2>
          <p className="text-xs font-spartan mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            Read-only entries from the previous journal format
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg text-xs font-spartan font-semibold transition-colors hover:bg-[var(--color-surface-hover)]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Back to Journal
        </button>
      </div>

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-10 pb-6 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[var(--color-text-tertiary)] border-t-[var(--color-brand-500)] rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm font-spartan" style={{ color: 'var(--color-text-tertiary)' }}>
              No archived entries found.
            </p>
          </div>
        ) : (
          entries.map(entry => (
            <ArchiveEntry key={entry._id} entry={entry} />
          ))
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => loadPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-xs font-spartan font-semibold transition-colors disabled:opacity-30"
              style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface-elevated)' }}
            >
              Previous
            </button>
            <span className="text-xs font-spartan" style={{ color: 'var(--color-text-tertiary)' }}>
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => loadPage(page + 1)}
              disabled={page >= pagination.pages}
              className="px-3 py-1.5 rounded-lg text-xs font-spartan font-semibold transition-colors disabled:opacity-30"
              style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface-elevated)' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalArchiveView;
