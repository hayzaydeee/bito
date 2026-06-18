import React from 'react';

/* ─────────────────────────────────────────────────────────────
   AppearancePreview — live CSS-rendered mini app-shell
   
   Uses explicit inline styles derived from JS token lookups
   (NOT reading CSS variables) so it can preview any theme
   without affecting the real app during hover.
   ───────────────────────────────────────────────────────────── */

// Static token lookup — matches the values in standard-theme.css exactly.
// Format: { bg, surface, surface2, ink, ink2, signal }
const TOKENS = {
  indigo: {
    dark: {
      bg: '#050507', bgLine: 'rgba(244,241,234,0.10)',
      surface: '#141418', surface2: '#1c1c22',
      ink: '#f3efe6', ink2: '#b4b0a7', ink3: '#79766e',
      native: '#a78bfa', complement: 'hsl(44,96%,56%)',
      nativeInk: '#160f2e', complementInk: 'hsl(44,60%,10%)',
    },
    light: {
      bg: '#f4f2ea', bgLine: 'rgba(22,20,15,0.09)',
      surface: '#ffffff', surface2: '#f1efe7',
      ink: '#16140f', ink2: '#57534a', ink3: '#8a857a',
      native: '#6f4ee6', complement: 'hsl(44,78%,40%)',
      nativeInk: '#ffffff', complementInk: '#ffffff',
    },
  },
  mineral: {
    dark: {
      bg: 'hsl(30,10%,6%)', bgLine: 'rgba(235,225,210,0.10)',
      surface: 'hsl(30,9%,13%)', surface2: 'hsl(30,8%,17%)',
      ink: 'hsl(30,14%,93%)', ink2: 'hsl(30,8%,66%)', ink3: 'hsl(30,6%,48%)',
      native: 'hsl(32,88%,60%)', complement: 'hsl(212,80%,64%)',
      nativeInk: 'hsl(30,60%,8%)', complementInk: 'hsl(214,50%,8%)',
    },
    light: {
      bg: 'hsl(32,20%,95%)', bgLine: 'rgba(100,80,60,0.09)',
      surface: 'hsl(32,14%,99%)', surface2: 'hsl(32,16%,92%)',
      ink: 'hsl(30,28%,10%)', ink2: 'hsl(30,16%,44%)', ink3: 'hsl(30,10%,62%)',
      native: 'hsl(32,72%,34%)', complement: 'hsl(212,68%,38%)',
      nativeInk: '#ffffff', complementInk: '#ffffff',
    },
  },
  forest: {
    dark: {
      bg: 'hsl(152,26%,5%)', bgLine: 'rgba(190,230,200,0.10)',
      surface: 'hsl(152,18%,12%)', surface2: 'hsl(152,15%,16%)',
      ink: 'hsl(150,18%,93%)', ink2: 'hsl(150,10%,66%)', ink3: 'hsl(150,7%,47%)',
      native: 'hsl(152,78%,55%)', complement: 'hsl(332,82%,68%)',
      nativeInk: 'hsl(152,40%,6%)', complementInk: 'hsl(332,40%,8%)',
    },
    light: {
      bg: 'hsl(150,18%,95%)', bgLine: 'rgba(60,120,80,0.09)',
      surface: 'hsl(150,10%,99%)', surface2: 'hsl(150,16%,92%)',
      ink: 'hsl(155,28%,10%)', ink2: 'hsl(152,14%,42%)', ink3: 'hsl(150,8%,60%)',
      native: 'hsl(155,54%,30%)', complement: 'hsl(332,62%,38%)',
      nativeInk: '#ffffff', complementInk: '#ffffff',
    },
  },
  ember: {
    dark: {
      bg: 'hsl(18,30%,6%)', bgLine: 'rgba(235,200,175,0.10)',
      surface: 'hsl(18,22%,13%)', surface2: 'hsl(18,18%,17%)',
      ink: 'hsl(28,22%,93%)', ink2: 'hsl(24,12%,66%)', ink3: 'hsl(20,8%,48%)',
      native: 'hsl(22,96%,60%)', complement: 'hsl(198,84%,62%)',
      nativeInk: 'hsl(18,60%,8%)', complementInk: 'hsl(200,50%,8%)',
    },
    light: {
      bg: 'hsl(24,24%,96%)', bgLine: 'rgba(140,90,50,0.09)',
      surface: 'hsl(24,16%,99%)', surface2: 'hsl(24,20%,92%)',
      ink: 'hsl(20,32%,10%)', ink2: 'hsl(20,18%,44%)', ink3: 'hsl(20,10%,62%)',
      native: 'hsl(18,78%,36%)', complement: 'hsl(198,68%,38%)',
      nativeInk: '#ffffff', complementInk: '#ffffff',
    },
  },
  ocean: {
    dark: {
      bg: 'hsl(214,34%,6%)', bgLine: 'rgba(180,210,240,0.10)',
      surface: 'hsl(214,24%,13%)', surface2: 'hsl(214,20%,17%)',
      ink: 'hsl(210,18%,93%)', ink2: 'hsl(210,10%,66%)', ink3: 'hsl(210,6%,47%)',
      native: 'hsl(210,84%,64%)', complement: 'hsl(34,90%,58%)',
      nativeInk: 'hsl(214,50%,8%)', complementInk: 'hsl(34,60%,8%)',
    },
    light: {
      bg: 'hsl(210,22%,96%)', bgLine: 'rgba(40,80,140,0.09)',
      surface: 'hsl(210,14%,99%)', surface2: 'hsl(210,18%,92%)',
      ink: 'hsl(210,32%,10%)', ink2: 'hsl(210,16%,42%)', ink3: 'hsl(210,9%,60%)',
      native: 'hsl(210,66%,36%)', complement: 'hsl(34,78%,40%)',
      nativeInk: '#ffffff', complementInk: '#ffffff',
    },
  },
  rose: {
    dark: {
      bg: 'hsl(340,28%,6%)', bgLine: 'rgba(240,200,215,0.10)',
      surface: 'hsl(340,20%,13%)', surface2: 'hsl(340,16%,17%)',
      ink: 'hsl(340,16%,93%)', ink2: 'hsl(340,9%,66%)', ink3: 'hsl(340,6%,47%)',
      native: 'hsl(342,82%,68%)', complement: 'hsl(162,72%,52%)',
      nativeInk: 'hsl(342,40%,8%)', complementInk: 'hsl(162,44%,6%)',
    },
    light: {
      bg: 'hsl(340,20%,96%)', bgLine: 'rgba(140,60,80,0.09)',
      surface: 'hsl(340,12%,99%)', surface2: 'hsl(340,18%,92%)',
      ink: 'hsl(342,28%,10%)', ink2: 'hsl(340,14%,42%)', ink3: 'hsl(338,8%,60%)',
      native: 'hsl(342,64%,36%)', complement: 'hsl(162,54%,32%)',
      nativeInk: '#ffffff', complementInk: '#ffffff',
    },
  },
};

/** Return the resolved signal for this token set + accentMode */
const resolveSignal = (t, accentMode, isDark) => {
  if (!t) return '#a78bfa';
  // Indigo dark: native by default, complement opt-in
  if (!isDark) return accentMode === 'complement' ? t.complement : t.native;
  return accentMode === 'native' ? t.native : t.complement;
};

const resolveSignalInk = (t, accentMode, isDark) => {
  if (!t) return '#160f2e';
  if (!isDark) return accentMode === 'complement' ? t.complementInk : t.nativeInk;
  return accentMode === 'native' ? t.nativeInk : t.complementInk;
};

/** Get preview token set for a given theme + effectiveTheme */
export const getPreviewTokens = (livelyTheme, accentMode, effectiveTheme) => {
  const isDark = effectiveTheme === 'dark' || effectiveTheme === 'bw';
  const mode = isDark ? 'dark' : 'light';
  const t = TOKENS[livelyTheme]?.[mode] || TOKENS.indigo[mode];
  return {
    bg: t.bg,
    bgLine: t.bgLine,
    surface: t.surface,
    surface2: t.surface2,
    ink: t.ink,
    ink2: t.ink2,
    ink3: t.ink3,
    signal: resolveSignal(t, accentMode, isDark),
    signalInk: resolveSignalInk(t, accentMode, isDark),
  };
};

/* ── Component ── */
const AppearancePreview = ({ livelyTheme, accentMode, effectiveTheme, hovered, fill }) => {
  // `hovered` is the theme being hovered over — shows that world instead of the active one
  const theme = hovered || livelyTheme;
  const tok = getPreviewTokens(theme, accentMode, effectiveTheme);

  return (
    <div
      style={{
        background: tok.bg,
        borderRadius: 10,
        overflow: 'hidden',
        height: fill ? '100%' : 118,
        display: 'flex',
        transition: 'background 0.22s ease',
        border: `1px solid ${tok.bgLine}`,
        fontFamily: "'Space Mono', ui-monospace, monospace",
        userSelect: 'none',
      }}
    >
      {/* mini nav sidebar */}
      <div style={{
        width: 26,
        background: tok.surface,
        borderRight: `1px solid ${tok.bgLine}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 10,
        gap: 8,
        transition: 'background 0.22s ease',
      }}>
        {/* logo dot */}
        <div style={{ width: 12, height: 12, borderRadius: 3, background: tok.signal, transition: 'background 0.22s ease' }} />
        {/* nav icon stubs */}
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            width: 10, height: 2, borderRadius: 999,
            background: i === 1 ? tok.ink2 : tok.ink3,
            opacity: i === 1 ? 0.9 : 0.4,
          }} />
        ))}
      </div>

      {/* main content area */}
      <div style={{
        flex: 1,
        padding: '10px 10px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        overflow: 'hidden',
      }}>
        {/* kicker + title */}
        <div>
          <div style={{ fontSize: 6, letterSpacing: '0.18em', textTransform: 'uppercase', color: tok.ink3, marginBottom: 2 }}>
            Thursday — The Daybook
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: tok.ink, letterSpacing: '-0.01em', fontFamily: "'Fraunces', Georgia, serif" }}>
            Good morning
          </div>
        </div>

        {/* card */}
        <div style={{
          background: tok.surface,
          border: `1px solid ${tok.bgLine}`,
          borderRadius: 6,
          padding: '6px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          transition: 'background 0.22s ease',
        }}>
          {/* progress bar */}
          <div style={{ height: 3, background: tok.surface2, borderRadius: 999 }}>
            <div style={{ width: '62%', height: '100%', background: tok.signal, borderRadius: 999, transition: 'background 0.22s ease' }} />
          </div>
          {/* habit row stubs */}
          {[0.85, 0.6].map((opacity, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, opacity }}>
              <div style={{
                width: 10, height: 10, borderRadius: 2,
                background: i === 0 ? tok.signal : 'transparent',
                border: `1.5px solid ${i === 0 ? tok.signal : tok.ink3}`,
                transition: 'background 0.22s ease, border-color 0.22s ease',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, height: 2, background: tok.ink3, borderRadius: 999, opacity: 0.6 }} />
            </div>
          ))}
        </div>

        {/* add button stub */}
        <div style={{
          alignSelf: 'flex-end',
          background: tok.signal,
          color: tok.signalInk,
          borderRadius: 4,
          padding: '2px 7px',
          fontSize: 6,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 700,
          marginRight: 2,
          transition: 'background 0.22s ease',
        }}>
          + Add habit
        </div>
      </div>
    </div>
  );
};

export default AppearancePreview;
