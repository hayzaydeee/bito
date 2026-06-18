import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getPreviewTokens } from './AppearancePreview';

/* ─────────────────────────────────────────────────────────────
   AccentModeToggle — complement vs native signal picker
   
   Shows both signal swatches for the current theme so the
   user can see what they're choosing before they click.
   ───────────────────────────────────────────────────────────── */

const AccentModeToggle = () => {
  const { livelyTheme, accentMode, changeAccentMode, theme, systemTheme } = useTheme();

  const effectiveTheme = theme === 'auto' ? systemTheme : theme;
  const isDark = effectiveTheme === 'dark' || effectiveTheme === 'bw';

  // Get both signal colours for the current theme + brightness
  const complementTok = getPreviewTokens(livelyTheme, 'complement', effectiveTheme);
  const nativeTok     = getPreviewTokens(livelyTheme, 'native',     effectiveTheme);

  const options = [
    {
      value: 'complement',
      label: 'Complement',
      desc: 'Contrasting accent',
      signal: complementTok.signal,
      signalInk: complementTok.signalInk,
    },
    {
      value: 'native',
      label: 'Native',
      desc: "Theme's own colour",
      signal: nativeTok.signal,
      signalInk: nativeTok.signalInk,
    },
  ];

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map(opt => {
        const active = accentMode === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => changeAccentMode(opt.value)}
            title={opt.desc}
            aria-pressed={active}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              background: active ? 'var(--surface-2)' : 'var(--surface)',
              border: `1px solid ${active ? 'var(--line-3)' : 'var(--line-2)'}`,
              borderRadius: 'var(--r-btn)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease, border-color 0.15s ease',
              outline: 'none',
            }}
          >
            {/* Signal colour swatch */}
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: opt.signal,
              flexShrink: 0,
              boxShadow: active ? `0 0 0 2px var(--bg), 0 0 0 4px ${opt.signal}` : 'none',
              transition: 'background 0.18s ease, box-shadow 0.15s ease',
            }} />

            {/* Label + description */}
            <div>
              <div style={{
                fontFamily: 'var(--f-mono)',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: active ? 'var(--ink)' : 'var(--ink-2)',
                lineHeight: 1,
                marginBottom: 3,
              }}>
                {opt.label}
              </div>
              <div style={{
                fontFamily: 'var(--f-mono)',
                fontSize: 10,
                color: 'var(--ink-3)',
                lineHeight: 1.2,
              }}>
                {opt.desc}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default AccentModeToggle;
