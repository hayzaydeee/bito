import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/* ─────────────────────────────────────────────────────────────
   GridAnimationPicker V2 — pill segment selector, centered
   Shows a mini visual icon of each animation above the label.
   ───────────────────────────────────────────────────────────── */

const AnimPreviews = {
  none: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="8" strokeOpacity="0.4" />
      <line x1="6" y1="18" x2="18" y2="6" strokeOpacity="0.4" />
    </svg>
  ),
  reactive: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.2" />
      <circle cx="12" cy="12" r="9" strokeOpacity="0.3" strokeDasharray="2 3" />
    </svg>
  ),
  breathe: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="3" strokeOpacity="0.8" />
      <circle cx="12" cy="12" r="6" strokeOpacity="0.5" />
      <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
    </svg>
  ),
  drift: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M5 12h14" strokeOpacity="0.6" />
      <path d="M15 8l4 4-4 4" strokeOpacity="0.6" />
    </svg>
  ),
  aurora: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M12 4v2m0 12v2M4 12h2m12 0h2m-13.65-5.65l1.41 1.41m9.9 9.9l1.41 1.41M6.34 17.66l1.41-1.41m9.9-9.9l1.41-1.41" strokeOpacity="0.6" />
      <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.4" />
    </svg>
  ),
};

const LABELS = {
  none:     'Static',
  reactive: 'Reactive',
  breathe:  'Breathe',
  drift:    'Drift',
  aurora:   'Aurora',
};

const GridAnimationPicker = () => {
  const { gridAnimation, changeGridAnimation, gridAnimationOptions, designSystem, standardGrid } = useTheme();

  // Hidden if legacy DS or if grid is turned off completely
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
        {gridAnimationOptions.map((option) => {
          const isActive = gridAnimation === option.value;
          return (
            <button
              key={option.value}
              onClick={() => changeGridAnimation(option.value)}
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
              {AnimPreviews[option.value]}
              <span style={{
                fontFamily: 'var(--f-mono)',
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                lineHeight: 1,
                marginTop: 2,
              }}>
                {LABELS[option.value]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GridAnimationPicker;
