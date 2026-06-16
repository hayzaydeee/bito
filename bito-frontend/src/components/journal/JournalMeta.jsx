import React from 'react';
import {
  SmileyAngry, SmileySad, SmileyMeh, Smiley, SmileyWink,
  BatteryEmpty, BatteryLow, BatteryMedium, BatteryHigh, BatteryFull,
} from '@phosphor-icons/react';

/* -----------------------------------------------------------------
   JournalMeta — mood + energy as compact mono telemetry gauges.
   Sits under the dateline on the day spread ("The Ledger").
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

const Gauge = ({ label, icons, value, onChange }) => (
  <div className="flex items-center gap-2.5">
    <span className="std-kicker">{label}</span>
    <div className="flex items-center gap-1">
      {icons.map(({ Icon, label: l, color }, i) => {
        const val = i + 1;
        const active = value === val;
        return (
          <button
            key={val}
            title={l}
            onClick={() => onChange(active ? null : val)}
            className={`w-7 h-7 rounded-[var(--r-tag)] flex items-center justify-center transition-all ${
              active ? 'opacity-100' : 'opacity-45 hover:opacity-100 hover:bg-[var(--surface-2)]'
            }`}
            style={
              active
                ? {
                    backgroundColor: 'color-mix(in srgb, var(--signal) 14%, transparent)',
                    boxShadow: 'inset 0 0 0 1px var(--signal)',
                  }
                : undefined
            }
          >
            <Icon size={18} weight={active ? 'fill' : 'regular'} color={active ? color : 'var(--ink-2)'} />
          </button>
        );
      })}
    </div>
  </div>
);

const JournalMeta = ({ mood, energy, onMoodChange, onEnergyChange }) => (
  <div className="flex flex-wrap items-center gap-x-7 gap-y-3 justify-center sm:justify-start">
    <Gauge label="Mood" icons={MOOD_ICONS} value={mood} onChange={onMoodChange} />
    <Gauge label="Energy" icons={ENERGY_ICONS} value={energy} onChange={onEnergyChange} />
  </div>
);

export default JournalMeta;
