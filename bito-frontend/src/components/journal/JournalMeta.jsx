import React, { useState } from 'react';
import {
  SmileyAngry, SmileySad, SmileyMeh, Smiley, SmileyWink,
  BatteryEmpty, BatteryLow, BatteryMedium, BatteryHigh, BatteryFull,
} from '@phosphor-icons/react';

/* -----------------------------------------------------------------
   JournalMeta — compact metadata strip for mood, energy, tags
   Sits above the editor on the full journal page.
----------------------------------------------------------------- */

const MOOD_ICONS = [
  { Icon: SmileyAngry, label: 'Awful',   color: '#ef4444' },
  { Icon: SmileySad,   label: 'Bad',     color: '#f97316' },
  { Icon: SmileyMeh,   label: 'Okay',    color: '#eab308' },
  { Icon: Smiley,      label: 'Good',    color: '#22c55e' },
  { Icon: SmileyWink,  label: 'Great',   color: '#6366f1' },
];

const ENERGY_ICONS = [
  { Icon: BatteryEmpty,  label: 'Drained',  color: '#ef4444' },
  { Icon: BatteryLow,    label: 'Low',      color: '#f97316' },
  { Icon: BatteryMedium, label: 'Moderate', color: '#eab308' },
  { Icon: BatteryHigh,   label: 'High',     color: '#22c55e' },
  { Icon: BatteryFull,   label: 'Peak',     color: '#6366f1' },
];

const JournalMeta = ({ mood, energy, tags, onMoodChange, onEnergyChange, onAddTag, onRemoveTag }) => {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    const t = newTag.trim();
    if (t && !tags.includes(t)) {
      onAddTag(t);
      setNewTag('');
    }
  };

  return (
    <div className="space-y-3 text-sm">
      {/* Mood & Energy row */}
      <div className="flex flex-wrap items-stretch gap-3 justify-between sm:justify-center">
        {/* Mood */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
          style={{ borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-surface-secondary)' }}>
          {/* <span className="text-xs font-spartan font-semibold tracking-wide uppercase"
            style={{ color: 'var(--color-text-tertiary)' }}>
            Mood
          </span> */}
          {/* <div className="w-px h-5 mx-0.5" style={{ backgroundColor: 'var(--color-border-primary)' }} /> */}
          <div className="flex items-center gap-1">
            {MOOD_ICONS.map(({ Icon, label, color }, i) => {
              const val = i + 1;
              const active = mood === val;
              return (
                <button
                  key={val}
                  title={label}
                  onClick={() => onMoodChange(active ? null : val)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    active
                      ? 'bg-[var(--color-brand-500)]/15 scale-110 ring-2 ring-[var(--color-brand-400)]'
                      : 'hover:bg-[var(--color-surface-hover)] opacity-40 hover:opacity-100'
                  }`}
                >
                  <Icon size={20} weight={active ? 'fill' : 'regular'} color={active ? color : undefined} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Energy */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border sm:px2 sm:py-1"
          style={{ borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-surface-secondary)' }}>
          {/* <span className="text-xs font-spartan font-semibold tracking-wide uppercase"
            style={{ color: 'var(--color-text-tertiary)' }}>
            Energy
          </span> */}
          {/* <div className="w-px h-5 mx-0.5" style={{ backgroundColor: 'var(--color-border-primary)' }} /> */}
          <div className="flex items-center gap-1">
            {ENERGY_ICONS.map(({ Icon, label, color }, i) => {
              const val = i + 1;
              const active = energy === val;
              return (
                <button
                  key={val}
                  title={label}
                  onClick={() => onEnergyChange(active ? null : val)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    active
                      ? 'bg-[var(--color-success)]/15 scale-110 ring-2 ring-[var(--color-success)]'
                      : 'hover:bg-[var(--color-surface-hover)] opacity-40 hover:opacity-100'
                  }`}
                >
                  <Icon size={20} weight={active ? 'fill' : 'regular'} color={active ? color : undefined} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tags */}
      {/* <div className="flex items-center gap-1.5 flex-wrap">
        {tags.map(t => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-spartan
                       bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]"
          >
            {t}
            <button
              onClick={() => onRemoveTag(t)}
              className="hover:text-[var(--color-error)] transition-colors"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddTag()}
          placeholder="+ tag"
          className="w-16 bg-transparent text-xs font-spartan text-[var(--color-text-secondary)]
                     placeholder:text-[var(--color-text-tertiary)] outline-none"
        />
      </div> */}
    </div>
  );
};

export default JournalMeta;
