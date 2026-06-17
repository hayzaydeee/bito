import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  ArrowRight, MagnifyingGlass, ListBullets, ClockCounterClockwise, Archive,
  SmileyAngry, SmileySad, SmileyMeh, Smiley, SmileyWink,
  BatteryEmpty, BatteryLow, BatteryMedium, BatteryHigh, BatteryFull,
} from '@phosphor-icons/react';
import { journalV2Service } from '../../services/journalV2Service';

/* ═══════════════════════════════════════════════════════════════
   ReadingRoomCard — "Reading Room" on Journal Home
   Shows 3 most recent entries + action links to list / stream /
   search / archive sub-views.
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
  onOpenSearch,
  onOpenArchive,
  onSelectDate,
}) => {
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalEntries, setTotalEntries] = useState(0);

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

  return (
    <div className="std-card">
      <div className="p-5 sm:p-7">
        {/* Kicker */}
        <p className="std-kicker text-[var(--ink-3)] mb-3">Reading Room</p>

        {/* Description */}
        <p className="text-[14px] text-[var(--ink-2)] mb-5" style={{ fontFamily: 'var(--f-sans)' }}>
          Browse past entries, search, or reflect.
        </p>

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

        {/* Navigation actions */}
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
          <button onClick={onOpenSearch} className="std-btn std-btn--sm">
            <MagnifyingGlass size={14} weight="bold" />
            Search
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
