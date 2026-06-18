import React, { useState, useRef, useEffect } from 'react';
import { Lock } from '@phosphor-icons/react';
import { useTheme } from '../../contexts/ThemeContext';
import AppearancePreview from './AppearancePreview';
import AccentModeToggle from './AccentModeToggle';

/* ─────────────────────────────────────────────────────────────
   LivelyThemePicker V2.1
   
   - Single unified chip row (free + premium together)
   - Free chips are full opacity; premium are locked with overlay
   - Preview scales taller on md+ breakpoint
   - AccentModeToggle inline below chips
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Live preview strip ─────────────────────────────── */}
      {/* Taller on md+ via inline CSS since we can't use Tailwind in JSX inline styles */}
      <div className="h-[118px] md:h-[160px]" style={{ position: 'relative' }}>
        <AppearancePreview
          livelyTheme={livelyTheme}
          accentMode={accentMode}
          effectiveTheme={effectiveTheme}
          hovered={hoveredTheme}
          fill
        />
      </div>

      {/* ── All theme swatches in one row ─────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Tier legend inline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 9, fontFamily: 'var(--f-mono)', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
            Palette
          </span>
          {!isPremium && (
            <span style={{ fontSize: 9, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', color: 'var(--ink-3)' }}>
              <span style={{ color: 'var(--signal)', fontWeight: 700 }}>●</span>
              {' '}Premium locked
            </span>
          )}
        </div>

        {/* Single unified chip row — wraps naturally on narrow screens */}
        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {livelyOptions.map(option => {
            const locked = option.tier === 'premium' && !isPremium;
            return (
              <div key={option.value} style={{ position: 'relative' }}>
                <PaletteChip
                  option={option}
                  active={livelyTheme === option.value}
                  locked={locked}
                  isDark={isDark}
                  livelyHue={livelyHue}
                  onClick={() => handleSwatchClick(option)}
                  onHoverEnter={() => { if (!locked) setHoveredTheme(option.value); }}
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
            );
          })}
        </div>
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
    chipBg     = `hsl(${livelyHue}, 78%, 55%)`;
    chipSignal = `hsl(${(livelyHue + 180) % 360}, 80%, 64%)`;
  } else {
    chipBg     = option.native;
    chipSignal = option.complement;
  }

  chipBg     = chipBg     || 'var(--surface)';
  chipSignal = chipSignal || 'var(--signal)';

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
        opacity: locked ? 0.45 : 1,
        padding: 0,
        background: 'transparent',
        transition: 'transform 0.15s ease, outline 0.15s ease, border-color 0.15s ease, opacity 0.15s ease',
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
      <div style={{
        height: 28,
        background: chipBg,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {locked && <Lock size={10} weight="fill" style={{ color: 'rgba(255,255,255,0.7)', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />}
        {isCustom && !locked && (
          <span style={{ fontSize: 7, fontFamily: 'var(--f-mono)', fontWeight: 700, color: `hsl(${livelyHue},40%,80%)`, letterSpacing: '0.08em' }}>HUE</span>
        )}
      </div>

      {/* Bottom: surface + label + signal dot */}
      <div style={{
        height: 24,
        background: 'var(--surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 6px',
        gap: 2,
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
          maxWidth: 34,
          textOverflow: 'ellipsis',
        }}>
          {isCustom ? `${livelyHue}°` : option.label}
        </span>
        <div style={{
          width: 7,
          height: 7,
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
