import React, { useState } from 'react';
import HabitIcon from './HabitIcon';

const CATEGORIES = {
  Activity: ['Barbell', 'Bicycle', 'Person', 'PersonSimple', 'SwimmingPool', 'Football', 'Basketball', 'Volleyball'],
  Health: ['Drop', 'Heart', 'Pill', 'Bed', 'Tooth', 'Leaf', 'Sun', 'Moon'],
  Mind: ['Brain', 'BookOpen', 'Notebook', 'Pen', 'Code', 'Microphone', 'Camera', 'Palette', 'MusicNote'],
  Productivity: ['Target', 'Lightning', 'Clock', 'Calendar', 'ChartBar', 'TrendUp', 'Check', 'Star'],
  Life: ['Briefcase', 'CurrencyDollar', 'Users', 'Globe', 'House', 'PawPrint', 'Sparkle', 'Handshake', 'Smiley', 'Trophy', 'Medal', 'Fire'],
};

/**
 * IconPicker — curated Phosphor icon grid (DRILL).
 * Standardized: mono category tabs, fixed-height grid (no modal jump),
 * signal selection (no scale jitter), live current-pick readout.
 *
 * Props:
 *   value    – current icon name string (e.g. "Target")
 *   onChange – called with icon name string when user selects
 */
const IconPicker = ({ value, onChange }) => {
  const [activeCategory, setActiveCategory] = useState(() => {
    const found = Object.keys(CATEGORIES).find((cat) => CATEGORIES[cat].includes(value));
    return found || Object.keys(CATEGORIES)[0];
  });

  return (
    <div className="space-y-2.5">
      {/* Label + current pick */}
      <div className="flex items-center justify-between">
        <span className="std-kicker">Icon</span>
        <span className="flex items-center gap-1.5 text-[var(--ink-3)]">
          <HabitIcon icon={value} size={14} />
          <span className="std-mono text-[10px] uppercase tracking-wide">{value}</span>
        </span>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 flex-wrap">
        {Object.keys(CATEGORIES).map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className="px-2.5 py-1 rounded-[var(--r-tag)] std-mono text-[10px] uppercase tracking-wider transition-colors"
              style={{
                backgroundColor: isActive ? 'var(--signal)' : 'transparent',
                color: isActive ? 'var(--signal-ink)' : 'var(--ink-3)',
                border: isActive ? '1px solid var(--signal)' : '1px solid var(--line)',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Icon grid — fixed min height so the modal never jumps */}
      <div className="grid grid-cols-8 gap-1.5 content-start min-h-[92px]">
        {CATEGORIES[activeCategory].map((iconName) => {
          const isSelected = value === iconName;
          return (
            <button
              key={iconName}
              type="button"
              title={iconName}
              onClick={() => onChange(iconName)}
              className="aspect-square rounded-[var(--r-btn)] flex items-center justify-center transition-colors"
              style={{
                backgroundColor: isSelected ? 'var(--signal)' : 'var(--surface-2)',
                color: isSelected ? 'var(--signal-ink)' : 'var(--ink-2)',
                border: `1px solid ${isSelected ? 'var(--signal)' : 'var(--line)'}`,
              }}
            >
              <HabitIcon icon={iconName} size={18} weight={isSelected ? 'fill' : 'regular'} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default IconPicker;
