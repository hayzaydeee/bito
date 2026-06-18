import React, { useState, useRef, useEffect } from 'react';
import { Lock } from '@phosphor-icons/react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * LivelyThemePicker
 * Circular swatch row for choosing a lively color theme within Standard DS.
 * Free: Indigo + Obsidian. Premium: Forest, Ember, Ocean, Rose, Custom.
 */
const LivelyThemePicker = () => {
  const {
    livelyTheme,
    livelyHue,
    changeLivelyTheme,
    changeLivelyHue,
    livelyOptions,
    effectiveTheme,
    designSystem,
  } = useTheme();

  const [customOpen, setCustomOpen] = useState(false);
  const customRef = useRef(null);

  // Close custom popover on outside click
  useEffect(() => {
    if (!customOpen) return;
    const handler = (e) => {
      if (customRef.current && !customRef.current.contains(e.target)) {
        setCustomOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [customOpen]);

  if (designSystem !== 'standard') return null;

  const isDark = effectiveTheme === 'dark' || effectiveTheme === 'bw';

  // TODO: replace with real subscription check when billing is wired
  const isPremium = false;

  const handleSwatchClick = (option) => {
    if (option.tier === 'premium' && !isPremium) return;
    if (option.value === 'custom') {
      setCustomOpen((prev) => !prev);
      changeLivelyTheme('custom');
      return;
    }
    setCustomOpen(false);
    changeLivelyTheme(option.value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {livelyOptions.map((option) => {
          const isActive = livelyTheme === option.value;
          const isLocked = option.tier === 'premium' && !isPremium;
          const isCustom = option.value === 'custom';

          let swatchColor;
          if (isCustom) {
            swatchColor = `hsl(${livelyHue}, 72%, 58%)`;
          } else {
            swatchColor = isDark ? option.previewDark : option.previewLight;
          }

          return (
            <div
              key={option.value}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, position: 'relative' }}
            >
              <button
                onClick={() => handleSwatchClick(option)}
                disabled={isLocked}
                title={isLocked ? `${option.label} — Premium` : option.label}
                style={{
                  position: 'relative',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: swatchColor,
                  border: isActive
                    ? '2px solid var(--ink)'
                    : isLocked
                    ? '2px dashed var(--line-3)'
                    : '2px solid transparent',
                  outline: isActive ? '2px solid var(--signal)' : 'none',
                  outlineOffset: 2,
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  opacity: isLocked ? 0.55 : 1,
                  transition: 'transform 0.15s ease, outline 0.15s ease',
                  boxShadow: isActive
                    ? '0 0 0 4px color-mix(in srgb, var(--signal) 20%, transparent)'
                    : 'none',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => { if (!isLocked) e.currentTarget.style.transform = 'scale(1.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {isLocked && (
                  <Lock
                    size={14}
                    weight="fill"
                    style={{ color: 'rgba(255,255,255,0.85)', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
                  />
                )}
                {isCustom && !isLocked && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: `hsl(${livelyHue}, 35%, 12%)`,
                    fontFamily: 'var(--f-mono, monospace)',
                    letterSpacing: '0.05em',
                    userSelect: 'none',
                  }}>HUE</span>
                )}
              </button>

              <span style={{
                fontSize: 9,
                fontFamily: 'var(--f-mono, monospace)',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: isActive ? 'var(--ink)' : 'var(--ink-3)',
              }}>
                {option.label}
              </span>

              {/* Custom hue popover */}
              {isCustom && customOpen && !isLocked && (
                <div
                  ref={customRef}
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 12px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--surface)',
                    border: '1px solid var(--line-2)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    zIndex: 100,
                    width: 180,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <span style={{
                    fontSize: 9,
                    fontFamily: 'var(--f-mono, monospace)',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-3)',
                  }}>Hue</span>

                  <input
                    type="range"
                    min={0}
                    max={359}
                    value={livelyHue}
                    onChange={(e) => changeLivelyHue(Number(e.target.value))}
                    style={{
                      width: '100%',
                      appearance: 'none',
                      height: 6,
                      borderRadius: 999,
                      background: 'linear-gradient(to right,hsl(0,72%,58%),hsl(60,72%,58%),hsl(120,72%,58%),hsl(180,72%,58%),hsl(240,72%,58%),hsl(300,72%,58%),hsl(360,72%,58%))',
                      cursor: 'pointer',
                      outline: 'none',
                      border: 'none',
                    }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: `hsl(${livelyHue},72%,58%)`,
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 10,
                      fontFamily: 'var(--f-mono, monospace)',
                      color: 'var(--ink-2)',
                    }}>{livelyHue}&deg;</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isPremium && (
        <p style={{
          margin: 0,
          fontSize: 11,
          fontFamily: 'var(--f-sans, sans-serif)',
          color: 'var(--ink-3)',
          lineHeight: 1.5,
        }}>
          Forest, Ember, Ocean, Rose &amp; Custom are{' '}
          <span style={{ color: 'var(--signal)', fontWeight: 600 }}>Premium</span>.
        </p>
      )}
    </div>
  );
};

export default LivelyThemePicker;
