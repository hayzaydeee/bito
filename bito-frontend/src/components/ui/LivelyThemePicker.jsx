import React, { useState, useRef, useEffect } from 'react';
import { Lock } from '@phosphor-icons/react';
import { useTheme } from '../../contexts/ThemeContext';
import AppearancePreview from './AppearancePreview';
import AccentModeToggle from './AccentModeToggle';

/* ─────────────────────────────────────────────────────────────
   LivelyThemePicker V2
   
   Palette chip cards (not circles) — each chip shows:
     - bg colour strip (top)
     - surface + signal dot (bottom)
     - label in mono
   
   Live preview strip driven by hover: hovered theme is shown
   in AppearancePreview without affecting the real app.
   Clicking confirms the selection.
   ───────────────────────────────────────────────────────────── */

const LivelyThemePicker = () => {
  const {
    livelyTheme,
    livelyHue,
    changeLivelyTheme,
    changeLivelyHue,
    livelyOptions,
    accentMode,
    theme,
    systemTheme,
    designSystem,
  } = useTheme();

  const effectiveTheme = theme === 'auto' ? systemTheme : theme;
  const isDark = effectiveTheme === 'dark' || effectiveTheme === 'bw';

  const [hoveredTheme, setHoveredTheme] = useState(null);
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

  const freeOptions    = livelyOptions.filter(o => o.tier === 'free');
  const premiumOptions = livelyOptions.filter(o => o.tier === 'premium');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Live preview strip ─────────────────────────────── */}
      <AppearancePreview
        livelyTheme={livelyTheme}
        accentMode={accentMode}
        effectiveTheme={effectiveTheme}
        hovered={hoveredTheme}
      />

      {/* ── Free tier swatches ────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 9, fontFamily: 'var(--f-mono)', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          Free
        </span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {freeOptions.map(option => (
            <PaletteChip
              key={option.value}
              option={option}
              active={livelyTheme === option.value}
              locked={false}
              isDark={isDark}
              livelyHue={livelyHue}
              onClick={() => handleSwatchClick(option)}
              onHoverEnter={() => setHoveredTheme(option.value)}
              onHoverLeave={() => setHoveredTheme(null)}
            />
          ))}
        </div>
      </div>

      {/* ── Premium tier swatches ─────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 9, fontFamily: 'var(--f-mono)', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          Premium
        </span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {premiumOptions.map(option => (
            <div key={option.value} style={{ position: 'relative' }}>
              <PaletteChip
                option={option}
                active={livelyTheme === option.value}
                locked={!isPremium}
                isDark={isDark}
                livelyHue={livelyHue}
                onClick={() => handleSwatchClick(option)}
                onHoverEnter={() => { if (isPremium) setHoveredTheme(option.value); }}
                onHoverLeave={() => setHoveredTheme(null)}
              />
              {/* Custom hue popover */}
              {option.value === 'custom' && customOpen && isPremium && (
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
                  <span style={{ fontSize: 9, fontFamily: 'var(--f-mono)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Hue</span>
                  <input
                    type="range" min={0} max={359} value={livelyHue}
                    onChange={(e) => changeLivelyHue(Number(e.target.value))}
                    style={{
                      width: '100%', appearance: 'none', height: 6, borderRadius: 999,
                      background: 'linear-gradient(to right,hsl(0,72%,58%),hsl(60,72%,58%),hsl(120,72%,58%),hsl(180,72%,58%),hsl(240,72%,58%),hsl(300,72%,58%),hsl(360,72%,58%))',
                      cursor: 'pointer', outline: 'none', border: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: `hsl(${livelyHue},72%,58%)` }} />
                    <span style={{ fontSize: 10, fontFamily: 'var(--f-mono)', color: 'var(--ink-2)' }}>{livelyHue}&deg;</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {!isPremium && (
          <p style={{ margin: '2px 0 0', fontSize: 11, fontFamily: 'var(--f-sans)', color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Ember, Ocean, Rose &amp; Custom are{' '}
            <span style={{ color: 'var(--signal)', fontWeight: 600 }}>Premium</span>.
          </p>
        )}
      </div>

      {/* ── Signal accent toggle ──────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 9, fontFamily: 'var(--f-mono)', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          Signal
        </span>
        <AccentModeToggle />
      </div>
    </div>
  );
};

/* ── PaletteChip — mini colour card ───────────────────────── */
const PaletteChip = ({ option, active, locked, isDark, livelyHue, onClick, onHoverEnter, onHoverLeave }) => {
  const isCustom = option.value === 'custom';

  // Chip colours — bg top strip and signal dot
  let chipBg, chipSignal;
  if (isCustom) {
    chipBg     = `hsl(${livelyHue}, 26%, ${isDark ? '5%' : '95%'})`;
    chipSignal = `hsl(${livelyHue}, 78%, 55%)`;
  } else {
    chipBg     = isDark ? option.previewDark  : option.previewLight;
    chipSignal = isDark ? option.signalDark   : option.signalLight;
  }

  // Fallback for null (shouldn't happen but guard)
  chipBg     = chipBg     || 'var(--surface)';
  chipSignal = chipSignal || 'var(--signal)';

  // The "environment" bg is slightly lighter/darker than chip bg
  const envBg = isDark
    ? 'color-mix(in srgb, ' + chipBg + ' 60%, #000000 40%)'
    : 'color-mix(in srgb, ' + chipBg + ' 60%, #ffffff 40%)';

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      disabled={locked}
      title={locked ? `${option.label} — Premium` : option.label}
      aria-pressed={active}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 58,
        borderRadius: 8,
        overflow: 'hidden',
        border: active
          ? `2px solid var(--ink)`
          : locked
          ? '2px dashed var(--line-2)'
          : '2px solid var(--line-2)',
        outline: active ? `2px solid var(--signal)` : 'none',
        outlineOffset: 2,
        cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked ? 0.5 : 1,
        padding: 0,
        background: 'transparent',
        transition: 'transform 0.15s ease, outline 0.15s ease, border-color 0.15s ease',
        boxShadow: active
          ? '0 0 0 4px color-mix(in srgb, var(--signal) 18%, transparent)'
          : 'none',
        flexShrink: 0,
      }}
      onMouseOver={(e) => { if (!locked) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onFocus={(e)     => { if (!locked) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseOut={(e)  => { e.currentTarget.style.transform = 'translateY(0)'; }}
      onBlur={(e)      => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Top: bg colour strip */}
      <div style={{ height: 28, background: chipBg, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {locked && <Lock size={10} weight="fill" style={{ color: 'rgba(255,255,255,0.7)', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />}
        {isCustom && !locked && (
          <span style={{ fontSize: 7, fontFamily: 'var(--f-mono)', fontWeight: 700, color: `hsl(${livelyHue},40%,80%)`, letterSpacing: '0.08em' }}>HUE</span>
        )}
      </div>

      {/* Bottom: surface + signal dot */}
      <div style={{
        height: 24,
        background: 'var(--surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 6px',
      }}>
        <span style={{
          fontSize: 7,
          fontFamily: 'var(--f-mono)',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: active ? 'var(--ink)' : 'var(--ink-3)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          maxWidth: 36,
          textOverflow: 'ellipsis',
        }}>
          {isCustom ? `${livelyHue}°` : option.label}
        </span>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: chipSignal,
          flexShrink: 0,
          transition: 'background 0.18s ease',
        }} />
      </div>
    </button>
  );
};

export default LivelyThemePicker;
