import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/* ─────────────────────────────────────────────────────────────
   GridStylePicker V2 — pill segment selector, centered
   Shows a mini visual preview of each pattern above the label.
   ───────────────────────────────────────────────────────────── */

// Mini pattern previews rendered as inline SVGs (24×24 viewbox)
const GridPreviews = {
  crosshatch: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <rect width="24" height="24" rx="3" fill="currentColor" fillOpacity="0.04" />
      {/* major lines */}
      <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      {/* minor lines */}
      <line x1="6"  y1="2" x2="6"  y2="22" stroke="currentColor" strokeWidth="0.4" strokeOpacity="0.25" />
      <line x1="18" y1="2" x2="18" y2="22" stroke="currentColor" strokeWidth="0.4" strokeOpacity="0.25" />
      <line x1="2"  y1="6" x2="22" y2="6"  stroke="currentColor" strokeWidth="0.4" strokeOpacity="0.25" />
      <line x1="2" y1="18" x2="22" y2="18"  stroke="currentColor" strokeWidth="0.4" strokeOpacity="0.25" />
    </svg>
  ),
  dot: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <rect width="24" height="24" rx="3" fill="currentColor" fillOpacity="0.04" />
      {[4, 12, 20].flatMap(x =>
        [4, 12, 20].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill="currentColor" fillOpacity="0.5" />
        ))
      )}
    </svg>
  ),
  diagonal: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <rect width="24" height="24" rx="3" fill="currentColor" fillOpacity="0.04" />
      <line x1="0"  y1="12" x2="12" y2="0"  stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      <line x1="6"  y1="24" x2="24" y2="6"  stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      <line x1="0"  y1="20" x2="4"  y2="16" stroke="currentColor" strokeWidth="0.4" strokeOpacity="0.25" />
      <line x1="16" y1="24" x2="24" y2="16" stroke="currentColor" strokeWidth="0.4" strokeOpacity="0.25" />
    </svg>
  ),
};

const LABELS = {
  crosshatch: 'Crosshatch',
  dot:        'Dot',
  diagonal:   'Diagonal',
};

const GridStylePicker = () => {
  const { gridStyle, changeGridStyle, gridStyleOptions, designSystem, standardGrid } = useTheme();

  if (designSystem !== 'standard' || !standardGrid) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{
        display: 'flex',
        gap: 6,
        padding: 5,
        background: 'color-mix(in srgb, var(--surface-2) 60%, transparent)',
        borderRadius: 12,
        border: '1px solid var(--line)',
      }}>
        {gridStyleOptions.map((option) => {
          const isActive = gridStyle === option.value;
          return (
            <button
              key={option.value}
              onClick={() => changeGridStyle(option.value)}
              title={option.label}
              aria-pressed={isActive}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '7px 10px',
                borderRadius: 8,
                border: 'none',
                background: isActive ? 'var(--surface)' : 'transparent',
                color: isActive ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.18)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.14s ease, color 0.14s ease, box-shadow 0.14s ease',
                minWidth: 52,
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--ink-2)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--ink-3)'; }}
            >
              {GridPreviews[option.value] || GridPreviews.crosshatch}
              <span style={{
                fontFamily: 'var(--f-mono)',
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}>
                {LABELS[option.value] || option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GridStylePicker;
