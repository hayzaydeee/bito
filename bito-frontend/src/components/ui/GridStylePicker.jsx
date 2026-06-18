import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * GridStylePicker
 * Icon-button row for selecting the Standard surface grid style.
 * Only visible when designSystem === 'standard' and standardGrid is on.
 */

// Inline SVG icons for each grid style — tiny, no external dep
const GridIcons = {
  crosshatch: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" strokeWidth="1.2" />
      <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.2" />
      <line x1="4" y1="1" x2="4" y2="15" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.4" />
      <line x1="12" y1="1" x2="12" y2="15" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.4" />
      <line x1="1" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.4" />
      <line x1="1" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.4" />
    </svg>
  ),
  dot: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {[3, 8, 13].flatMap((x) =>
        [3, 8, 13].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill="currentColor" />
        ))
      )}
    </svg>
  ),
  diagonal: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="0" y1="8" x2="8" y2="0" stroke="currentColor" strokeWidth="1.2" />
      <line x1="4" y1="16" x2="16" y2="4" stroke="currentColor" strokeWidth="1.2" />
      <line x1="0" y1="14" x2="2" y2="12" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.4" />
      <line x1="12" y1="16" x2="16" y2="12" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.4" />
    </svg>
  ),
  none: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" />
    </svg>
  ),
};

const GridStylePicker = () => {
  const {
    gridStyle,
    changeGridStyle,
    gridStyleOptions,
    designSystem,
    standardGrid,
  } = useTheme();

  if (designSystem !== 'standard' || !standardGrid) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px',
        background: 'color-mix(in srgb, var(--surface-2) 60%, transparent)',
        borderRadius: 10,
        border: '1px solid var(--line)',
        width: 'fit-content',
      }}
    >
      {gridStyleOptions.map((option) => {
        const isActive = gridStyle === option.value;
        return (
          <button
            key={option.value}
            onClick={() => changeGridStyle(option.value)}
            title={option.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: '5px 10px',
              borderRadius: 7,
              border: 'none',
              background: isActive ? 'var(--surface)' : 'transparent',
              color: isActive ? 'var(--ink)' : 'var(--ink-3)',
              boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.18)' : 'none',
              cursor: 'pointer',
              transition: 'background 0.14s ease, color 0.14s ease, box-shadow 0.14s ease',
              fontFamily: 'var(--f-mono, monospace)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--ink-2)'; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--ink-3)'; }}
          >
            {GridIcons[option.icon] || GridIcons.crosshatch}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default GridStylePicker;
