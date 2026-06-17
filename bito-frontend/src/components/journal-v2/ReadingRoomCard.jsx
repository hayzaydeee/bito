import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  ArrowRight, MagnifyingGlass, ListBullets, ClockCounterClockwise, Archive, X,
  SmileyAngry, SmileySad, SmileyMeh, Smiley, SmileyWink,
  BatteryEmpty, BatteryLow, BatteryMedium, BatteryHigh, BatteryFull,
} from '@phosphor-icons/react';
import { journalV2Service } from '../../services/journalV2Service';

/* ═══════════════════════════════════════════════════════════════
   ReadingRoomCard — "Reading Room" on Journal Home
   Shows recent entries, inline expandable search (top-right),
   and action links to list / stream / archive sub-views.
   ═══════════════════════════════════════════════════════════════ */

const MOOD_META = [
  { Icon: SmileyAngry, color: '#ef4444', label: 'Awful' },
  { Icon: SmileySad,   color: '#f97316', label: 'Bad' },
  { Icon: SmileyMeh,   color: '#eab308', label: 'Okay' },
  { Icon: Smiley,      color: '#22c55e', label: 'Good' },
  { Icon: SmileyWink,  color: '#6366f1', label: 'Great' },
];

const ENERGY_META = [
  { Icon: BatteryEmpty,  color: '#ef4444', label: 'Drained' },
  { Icon: BatteryLow,    color: '#f97316', label: 'Low' },
  { Icon: BatteryMedium, color: '#eab308', label: 'Moderate' },
  { Icon: BatteryHigh,   color: '#22c55e', label: 'High' },
  { Icon: BatteryFull,   color: '#6366f1', label: 'Peak' },
];

const RecentRow = memo(({ entry, onSelect }) => {
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
        });

  const mood = entry.mood ? MOOD_META[entry.mood - 1] : null;
  const energy = entry.energy ? ENERGY_META[entry.energy - 1] : null;

  return (
    <button
      onClick={() => onSelect(dateStr)}
      className="group w-full text-left flex items-baseline gap-3 px-1 py-3 border-b border-[var(--line)] hover:bg-[var(--surface-2)] transition-colors rounded-[6px]"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <h4 className="std-display text-[14px] font-bold text-[var(--ink)] flex-shrink-0">
            {formattedDate}
          </h4>
          {mood && (
            <span className="flex-shrink-0 self-center" title={`Mood: ${mood.label}`}>
              <mood.Icon size={12} weight="fill" color={mood.color} />
            </span>
          )}
          {energy && (
            <span className="flex-shrink-0 self-center" title={`Energy: ${energy.label}`}>
              <energy.Icon size={12} weight="fill" color={energy.color} />
            </span>
          )}
          {entry.wordCount > 0 && (
            <span className="ml-auto std-mono text-[10px] text-[var(--ink-3)] flex-shrink-0 self-center">
              {entry.wordCount} w
            </span>
          )}
          <ArrowRight size={12} weight="bold" className="text-[var(--ink-3)] flex-shrink-0 self-center opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </div>
        {entry.preview && (
          <p className="mt-0.5 text-[12px] text-[var(--ink-3)] leading-relaxed line-clamp-1">
            {entry.preview}
          </p>
        )}
      </div>
    </button>
  );
});
RecentRow.displayName = 'RecentRow';

const ReadingRoomCard = ({
  onOpenList,
  onOpenStream,
  onOpenArchive,
  onSelectDate,
}) => {
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalEntries, setTotalEntries] = useState(0);

  // Inline search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef(null);

  const loadRecent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await journalV2Service.getEntries({ page: 1, limit: 4 });
      setRecentEntries(data.entries || []);
      setTotalEntries(data.pagination?.total ?? 0);
    } catch {
      setRecentEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecent(); }, [loadRecent]);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      // Small delay to let the transition start before focusing
      const t = setTimeout(() => searchInputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const data = await journalV2Service.search(searchQuery.trim());
      setSearchResults(data);
    } catch {
      setSearchResults({ entries: [], query: searchQuery });
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults(null);
  }, []);

  return (
    <div className="std-card">
      <div className="p-5 sm:p-7">
        {/* Header row: kicker + search toggle */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="std-kicker text-[var(--ink-3)]">Reading Room</p>
            {!searchOpen && (
              <p className="text-[14px] text-[var(--ink-2)] mt-2" style={{ fontFamily: 'var(--f-sans)' }}>
                Browse past entries, search, or reflect.
              </p>
            )}
          </div>

          {/* Search: icon button → expanding bar */}
          <div
            className="flex items-center flex-shrink-0 overflow-hidden rounded-[var(--r-btn)] border transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              width: searchOpen ? '100%' : '36px',
              maxWidth: searchOpen ? '320px' : '36px',
              height: '36px',
              borderColor: searchOpen ? 'var(--signal)' : 'var(--line-2)',
              background: searchOpen ? 'var(--bg-2)' : 'transparent',
            }}
          >
            {searchOpen ? (
              /* Expanded search bar */
              <div className="flex items-center w-full h-full px-2.5 gap-2">
                <MagnifyingGlass
                  size={14}
                  weight="bold"
                  className="flex-shrink-0"
                  style={{ color: 'var(--signal)' }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSearch();
                    if (e.key === 'Escape') closeSearch();
                  }}
                  placeholder="Search entries..."
                  className="flex-1 min-w-0 bg-transparent text-[13px] outline-none"
                  style={{ color: 'var(--ink)', fontFamily: 'var(--f-sans)' }}
                />
                {searchQuery && (
                  <button
                    onClick={handleSearch}
                    disabled={searchLoading}
                    className="flex-shrink-0 std-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[6px] transition-colors"
                    style={{
                      color: 'var(--signal-ink)',
                      backgroundColor: 'var(--signal)',
                    }}
                  >
                    {searchLoading ? '...' : 'Go'}
                  </button>
                )}
                <button
                  onClick={closeSearch}
                  className="flex-shrink-0 p-0.5 rounded-[4px] transition-colors hover:bg-[var(--surface-2)]"
                  style={{ color: 'var(--ink-3)' }}
                  aria-label="Close search"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>
            ) : (
              /* Collapsed: icon button */
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full h-full flex items-center justify-center transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: 'var(--ink-3)' }}
                aria-label="Search journal"
              >
                <MagnifyingGlass size={15} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {/* Search results (when open + has results) */}
        {searchOpen && searchResults && (
          <div
            className="mb-4 max-h-48 overflow-y-auto rounded-[var(--r-tag)] border border-[var(--line)] bg-[var(--bg-2)] transition-all duration-200"
          >
            {searchResults.entries?.length === 0 ? (
              <p className="std-mono text-[10px] uppercase tracking-wider text-center py-4" style={{ color: 'var(--ink-3)' }}>
                No results for "{searchResults.query}"
              </p>
            ) : (
              searchResults.entries?.map(entry => (
                <button
                  key={entry._id}
                  onClick={() => {
                    const dateStr = new Date(entry.date).toISOString().split('T')[0];
                    onSelectDate(dateStr);
                    closeSearch();
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--line)] last:border-b-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--f-sans)' }}>
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="std-tag" style={entry.type !== 'micro' ? { color: 'var(--signal)', borderColor: 'color-mix(in srgb, var(--signal) 40%, transparent)' } : {}}>
                      {entry.type}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--ink-2)' }}>
                    {entry.plainTextContent?.slice(0, 120)}
                  </p>
                </button>
              ))
            )}
          </div>
        )}

        {/* Recent entries */}
        <div className="mb-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-[var(--line-2)] border-t-[var(--signal)] rounded-full animate-spin" />
            </div>
          ) : recentEntries.length === 0 ? (
            <div className="py-6 text-center">
              <p className="std-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                No entries yet — start writing today
              </p>
            </div>
          ) : (
            <div>
              <p className="std-mono text-[9px] uppercase tracking-wider text-[var(--ink-3)] mb-1.5">
                Recent
              </p>
              {recentEntries.map(entry => (
                <RecentRow
                  key={entry._id}
                  entry={entry}
                  onSelect={onSelectDate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Navigation actions — search removed, now inline above */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={onOpenList} className="std-btn std-btn--sm">
            <ListBullets size={14} weight="bold" />
            All entries
            {totalEntries > 0 && (
              <span className="std-mono text-[9px] text-[var(--ink-3)]">
                {totalEntries}
              </span>
            )}
          </button>
          <button onClick={onOpenStream} className="std-btn std-btn--sm">
            <ClockCounterClockwise size={14} weight="bold" />
            Timeline
          </button>
          <button onClick={onOpenArchive} className="std-btn std-btn--sm">
            <Archive size={14} weight="bold" />
            Archive
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(ReadingRoomCard);
