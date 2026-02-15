import React, { useState } from 'react';

/* -----------------------------------------------------------------
   JournalMeta — compact metadata strip for mood, energy, tags
   Sits above the editor on the full journal page.
----------------------------------------------------------------- */

const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😊'];
const ENERGY_EMOJI = ['🪫', '😴', '⚡', '🔋', '🚀'];

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
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {/* Mood */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">Mood</span>
        {MOOD_EMOJI.map((e, i) => {
          const val = i + 1;
          return (
            <button
              key={val}
              onClick={() => onMoodChange(mood === val ? null : val)}
              className={`w-7 h-7 rounded-md text-base transition-all ${
                mood === val
                  ? 'bg-[var(--color-brand-500)]/15 scale-110 ring-1 ring-[var(--color-brand-400)]'
                  : 'hover:bg-[var(--color-surface-hover)] opacity-50 hover:opacity-100'
              }`}
            >
              {e}
            </button>
          );
        })}
      </div>

      {/* Energy */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">Energy</span>
        {ENERGY_EMOJI.map((e, i) => {
          const val = i + 1;
          return (
            <button
              key={val}
              onClick={() => onEnergyChange(energy === val ? null : val)}
              className={`w-7 h-7 rounded-md text-base transition-all ${
                energy === val
                  ? 'bg-[var(--color-success)]/15 scale-110 ring-1 ring-[var(--color-success)]'
                  : 'hover:bg-[var(--color-surface-hover)] opacity-50 hover:opacity-100'
              }`}
            >
              {e}
            </button>
          );
        })}
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1.5 flex-wrap">
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
      </div>
    </div>
  );
};

export default JournalMeta;
