import React, { useState } from 'react';
import HabitIcon, { HABIT_ICONS } from './HabitIcon';

const CATEGORIES = {
  Activity: ['Barbell', 'Bicycle', 'Person', 'PersonSimple', 'SwimmingPool', 'Football', 'Basketball', 'Volleyball'],
  Health: ['Drop', 'Heart', 'Pill', 'Bed', 'Tooth', 'Leaf', 'Sun', 'Moon'],
  Mind: ['Brain', 'BookOpen', 'Notebook', 'Pen', 'Code', 'Microphone', 'Camera', 'Palette', 'MusicNote'],
  Productivity: ['Target', 'Lightning', 'Clock', 'Calendar', 'ChartBar', 'TrendUp', 'Check', 'Star'],
  Life: ['Briefcase', 'CurrencyDollar', 'Users', 'Globe', 'House', 'PawPrint', 'Sparkle', 'Handshake', 'Smiley', 'Trophy', 'Medal', 'Fire'],
};

/**
 * Curated Phosphor icon picker for habit icons.
 * Replaces the EMOJI_SETS pattern used in habit edit modals.
 *
 * Props:
 *   value    – current icon name string (e.g. "Target")
 *   onChange – called with icon name string when user selects
 */
const IconPicker = ({ value, onChange }) => {
  const [activeCategory, setActiveCategory] = useState(Object.keys(CATEGORIES)[0]);

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex gap-1 flex-wrap">
        {Object.keys(CATEGORIES).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-medium font-spartan transition-colors ${
              activeCategory === cat
                ? 'bg-[var(--color-brand-600)] text-white'
                : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Icon grid */}
      <div className="grid grid-cols-9 gap-1">
        {CATEGORIES[activeCategory].map((iconName) => {
          const isSelected = value === iconName;
          return (
            <button
              key={iconName}
              type="button"
              title={iconName}
              onClick={() => onChange(iconName)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-[var(--color-brand-600)] text-white ring-2 ring-[var(--color-brand-400)] scale-110'
                  : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] hover:scale-105'
              }`}
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
