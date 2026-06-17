import React, { memo } from 'react';
import { QuickCapture } from './MicroEntry';
import {
  SmileyAngry, SmileySad, SmileyMeh, Smiley, SmileyWink,
  BatteryEmpty, BatteryLow, BatteryMedium, BatteryHigh, BatteryFull,
  PencilSimpleLine, ArrowRight,
} from '@phosphor-icons/react';

/* ═══════════════════════════════════════════════════════════════
   TodaysDeskCard — "Today's Desk" on Journal Home
   Shows today's writing status + quick capture + CTA to open.
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

const TodaysDeskCard = ({
  wordCount = 0,
  mood = null,
  energy = null,
  microCount = 0,
  hasYesterday = false,
  onOpenToday,
  onOpenYesterday,
  onAddMicro,
}) => {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const moodInfo = mood ? MOOD_META[mood - 1] : null;
  const energyInfo = energy ? ENERGY_META[energy - 1] : null;
  const hasContent = wordCount > 0 || microCount > 0;

  return (
    <div className="std-card journal-home-desk-card" style={{ borderLeft: '3px solid var(--signal)' }}>
      <div className="p-5 sm:p-7">
        {/* Kicker */}
        <p className="std-kicker text-[var(--signal)] mb-3">Today's Desk</p>

        {/* Date heading */}
        <h2 className="std-display text-[26px] sm:text-[32px] font-bold leading-[0.95] text-[var(--ink)] mb-1">
          {weekday}
        </h2>
        <p className="std-mono text-[11px] text-[var(--ink-3)] tracking-wider uppercase mb-5">
          {dateStr}
        </p>

        {/* Status strip */}
        <div className="flex items-center gap-3 flex-wrap mb-5">
          {hasContent ? (
            <>
              <span className="std-mono text-[11px] text-[var(--ink-2)] tracking-wider uppercase">
                {wordCount} words
              </span>
              {microCount > 0 && (
                <>
                  <span className="text-[var(--ink-3)]">·</span>
                  <span className="std-mono text-[11px] text-[var(--ink-2)] tracking-wider uppercase">
                    {microCount} note{microCount !== 1 ? 's' : ''}
                  </span>
                </>
              )}
              {moodInfo && (
                <span className="flex items-center gap-1" title={`Mood: ${moodInfo.label}`}>
                  <moodInfo.Icon size={14} weight="fill" color={moodInfo.color} />
                  <span className="std-mono text-[10px] text-[var(--ink-3)]">{moodInfo.label}</span>
                </span>
              )}
              {energyInfo && (
                <span className="flex items-center gap-1" title={`Energy: ${energyInfo.label}`}>
                  <energyInfo.Icon size={14} weight="fill" color={energyInfo.color} />
                  <span className="std-mono text-[10px] text-[var(--ink-3)]">{energyInfo.label}</span>
                </span>
              )}
            </>
          ) : (
            <span className="std-mono text-[11px] text-[var(--ink-3)] tracking-wider uppercase">
              No entry yet today
            </span>
          )}
        </div>

        {/* Quick capture */}
        <div className="mb-5">
          <QuickCapture
            onSubmit={onAddMicro}
            placeholder="Quick thought..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onOpenToday}
            className="std-btn std-btn--signal"
          >
            <PencilSimpleLine size={15} weight="bold" />
            {hasContent ? 'Continue writing' : 'Start writing'}
          </button>

          {hasYesterday && onOpenYesterday && (
            <button
              onClick={onOpenYesterday}
              className="std-btn std-btn--sm"
            >
              Yesterday
              <ArrowRight size={13} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(TodaysDeskCard);
