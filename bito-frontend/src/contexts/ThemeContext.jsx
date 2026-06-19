import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { userAPI } from '../services/api';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const [theme, setTheme] = useState('dark'); // Default to dark
  // Design-system axis (orthogonal to light/dark): 'legacy' = current purple/serif
  // look, 'standard' = the new black/white + accent "DRILL" language. Legacy is the default.
  const [designSystem, setDesignSystem] = useState('legacy');
  // Standard-layout background grid (on by default)
  const [standardGrid, setStandardGrid] = useState(true);
  // Lively color theme (Standard DS only). Free: indigo, obsidian. Premium: the rest.
  const [livelyTheme, setLivelyTheme] = useState('indigo');
  // Custom hue (0-359) used when livelyTheme === 'custom'
  const [livelyHue, setLivelyHue] = useState(220);
  // Grid style for the Standard surface background
  const [gridStyle, setGridStyle] = useState('crosshatch');
  // Animated grid style
  const [gridAnimation, setGridAnimation] = useState('none');
  // Grid boldness (opacity/line weight)
  const [gridBoldness, setGridBoldness] = useState('low');
  // Accent mode: complement (default, shows craft) or native
  const [accentMode, setAccentMode] = useState('complement');
  const [systemTheme, setSystemTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);
  const initializedForRef = useRef(undefined); // tracks which user id we've initialized from
  const livelyHueDebounceRef = useRef(null);

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Load theme from user preferences — only once per user session.
  // Subsequent changes go through changeTheme() which sets state directly.
  useEffect(() => {
    // Wait for auth to finish before making theme decisions
    if (authLoading) return;

    const userId = user?._id || null;
    // Skip if we already initialized for this exact user
    if (initializedForRef.current === userId) return;
    initializedForRef.current = userId;

    if (user?.preferences?.theme) {
      setTheme(user.preferences.theme);
    } else {
      setTheme('auto');
    }
    setDesignSystem(user?.preferences?.designSystem === 'standard' ? 'standard' : 'legacy');
    setStandardGrid(user?.preferences?.standardGrid !== false);
    // Lively: load stored value, silently migrating 'obsidian' → 'mineral'
    const storedLively = user?.preferences?.livelyTheme || 'indigo';
    setLivelyTheme(storedLively === 'obsidian' ? 'mineral' : storedLively);
    setLivelyHue(typeof user?.preferences?.livelyHue === 'number' ? user.preferences.livelyHue : 220);
    setGridStyle(user?.preferences?.gridStyle || 'crosshatch');
    setGridAnimation(user?.preferences?.gridAnimation || 'none');
    setGridBoldness(user?.preferences?.gridBoldness || 'low');
    setAccentMode(user?.preferences?.accentMode || 'complement');
    setIsLoading(false);
  }, [user, authLoading]);

  // Apply theme to document
  useEffect(() => {
    // B/W is its own data-theme value; for Radix it maps to 'dark'
    const effectiveTheme = theme === 'auto' ? systemTheme : theme;
    
    // Remove existing theme attributes
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-bw');
    
    // Apply new theme
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    const bodyClass = effectiveTheme === 'bw' ? 'theme-bw' : `theme-${effectiveTheme}`;
    document.body.classList.add(bodyClass);
    
    // Update Radix UI theme appearance (Radix only knows dark/light)
    const radixAppearance = effectiveTheme === 'bw' ? 'dark' : effectiveTheme;
    const radixThemeRoot = document.querySelector('[data-accent-color]');
    if (radixThemeRoot) {
      radixThemeRoot.setAttribute('data-appearance', radixAppearance);
    }

    // Update PWA theme-color meta tag (palette depends on the active design system)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const legacy = { light: '#FAFBFF', dark: '#0D0A1A', bw: '#000000' };
      const standard = { light: '#faf9f6', dark: '#050507', bw: '#050507' };
      const palette = designSystem === 'standard' ? standard : legacy;
      metaThemeColor.setAttribute('content', palette[effectiveTheme] || palette.dark);
    }
  }, [theme, systemTheme, designSystem]);

  // Apply the design-system axis to the document (orthogonal to data-theme)
  useEffect(() => {
    document.documentElement.setAttribute('data-ds', designSystem);
    document.body.classList.remove('ds-legacy', 'ds-standard');
    document.body.classList.add(`ds-${designSystem}`);
  }, [designSystem]);

  // Apply the standard-layout grid toggle
  useEffect(() => {
    document.documentElement.setAttribute('data-grid', standardGrid ? 'on' : 'off');
  }, [standardGrid]);

  // Apply lively theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-lively', livelyTheme);
  }, [livelyTheme]);

  // Apply custom hue CSS property (only matters when livelyTheme === 'custom')
  useEffect(() => {
    document.documentElement.style.setProperty('--lively-hue', String(livelyHue));
  }, [livelyHue]);

  // Apply grid style attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-grid-style', gridStyle);
  }, [gridStyle]);

  // Apply grid animation attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-grid-anim', gridAnimation);
  }, [gridAnimation]);

  // Apply grid boldness attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-grid-boldness', gridBoldness);
  }, [gridBoldness]);

  // Reactive grid mouse tracking
  useEffect(() => {
    if (gridAnimation !== 'reactive') return;
    
    let rAF;
    const handleMouseMove = (e) => {
      if (rAF) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rAF) cancelAnimationFrame(rAF);
    };
  }, [gridAnimation]);

  // Apply accent mode attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentMode);
  }, [accentMode]);

  const changeTheme = async (newTheme) => {
    setTheme(newTheme);

    // Save to backend if user is authenticated
    if (user) {
      try {
        await userAPI.updateProfile({
          preferences: {
            ...user.preferences,
            theme: newTheme
          }
        });
        // Keep AuthContext user in sync so the [user] effect doesn't revert
        if (updateUser) {
          updateUser({ preferences: { ...user.preferences, theme: newTheme } });
        }
      } catch (error) {
        console.error('Failed to save theme preference:', error);
        // Revert on error
        setTheme(user.preferences?.theme || 'auto');
      }
    }
  };

  const changeDesignSystem = async (next) => {
    const value = next === 'standard' ? 'standard' : 'legacy';
    setDesignSystem(value);

    if (user) {
      try {
        await userAPI.updateProfile({
          preferences: { ...user.preferences, designSystem: value }
        });
        if (updateUser) {
          updateUser({ preferences: { ...user.preferences, designSystem: value } });
        }
      } catch (error) {
        console.error('Failed to save design system preference:', error);
        setDesignSystem(user.preferences?.designSystem === 'standard' ? 'standard' : 'legacy');
      }
    }
  };

  const changeStandardGrid = async (enabled) => {
    const value = Boolean(enabled);
    setStandardGrid(value);

    if (user) {
      try {
        await userAPI.updateProfile({
          preferences: { ...user.preferences, standardGrid: value }
        });
        if (updateUser) {
          updateUser({ preferences: { ...user.preferences, standardGrid: value } });
        }
      } catch (error) {
        console.error('Failed to save grid preference:', error);
        setStandardGrid(user.preferences?.standardGrid !== false);
      }
    }
  };

  const changeLivelyTheme = async (name) => {
    setLivelyTheme(name);

    if (user) {
      try {
        await userAPI.updateProfile({
          preferences: { ...user.preferences, livelyTheme: name }
        });
        if (updateUser) {
          updateUser({ preferences: { ...user.preferences, livelyTheme: name } });
        }
      } catch (error) {
        console.error('Failed to save lively theme:', error);
        setLivelyTheme(user.preferences?.livelyTheme || 'indigo');
      }
    }
  };

  const changeLivelyHue = (hue) => {
    const value = Math.min(359, Math.max(0, Math.round(hue)));
    setLivelyHue(value);

    // Debounce API write — CSS updates instantly via the useEffect above
    if (livelyHueDebounceRef.current) clearTimeout(livelyHueDebounceRef.current);
    livelyHueDebounceRef.current = setTimeout(async () => {
      if (user) {
        try {
          await userAPI.updateProfile({
            preferences: { ...user.preferences, livelyHue: value }
          });
          if (updateUser) {
            updateUser({ preferences: { ...user.preferences, livelyHue: value } });
          }
        } catch (error) {
          console.error('Failed to save lively hue:', error);
        }
      }
    }, 300);
  };

  const changeGridStyle = async (style) => {
    setGridStyle(style);

    if (user) {
      try {
        await userAPI.updateProfile({
          preferences: { ...user.preferences, gridStyle: style }
        });
        if (updateUser) {
          updateUser({ preferences: { ...user.preferences, gridStyle: style } });
        }
      } catch (error) {
        console.error('Failed to save grid style:', error);
        setGridStyle(user.preferences?.gridStyle || 'crosshatch');
      }
    }
  };

  const changeGridAnimation = async (anim) => {
    setGridAnimation(anim);

    if (user) {
      try {
        await userAPI.updateProfile({
          preferences: { ...user.preferences, gridAnimation: anim }
        });
        if (updateUser) {
          updateUser({ preferences: { ...user.preferences, gridAnimation: anim } });
        }
      } catch (error) {
        console.error('Failed to save grid animation:', error);
        setGridAnimation(user.preferences?.gridAnimation || 'none');
      }
    }
  };

  const changeGridBoldness = async (boldness) => {
    setGridBoldness(boldness);

    if (user) {
      try {
        await userAPI.updateProfile({
          preferences: { ...user.preferences, gridBoldness: boldness }
        });
        if (updateUser) {
          updateUser({ preferences: { ...user.preferences, gridBoldness: boldness } });
        }
      } catch (error) {
        console.error('Failed to save grid boldness:', error);
        setGridBoldness(user.preferences?.gridBoldness || 'low');
      }
    }
  };

  const changeAccentMode = async (mode) => {
    setAccentMode(mode);

    if (user) {
      try {
        await userAPI.updateProfile({
          preferences: { ...user.preferences, accentMode: mode }
        });
        if (updateUser) {
          updateUser({ preferences: { ...user.preferences, accentMode: mode } });
        }
      } catch (error) {
        console.error('Failed to save accent mode:', error);
        setAccentMode(user.preferences?.accentMode || 'complement');
      }
    }
  };

  const getEffectiveTheme = () => {
    return theme === 'auto' ? systemTheme : theme;
  };

  // Radix UI only accepts 'dark' or 'light' — map bw → dark
  const getRadixAppearance = () => {
    const effective = getEffectiveTheme();
    return effective === 'bw' ? 'dark' : effective;
  };

  const value = {
    theme,
    systemTheme,
    effectiveTheme: getEffectiveTheme(),
    radixAppearance: getRadixAppearance(),
    isLoading,
    changeTheme,

    // Design-system axis (legacy | standard)
    designSystem,
    changeDesignSystem,
    standardGrid,
    changeStandardGrid,
    designSystemOptions: [
      { value: 'legacy', label: 'Legacy', description: 'The original purple & serif look' },
      { value: 'standard', label: 'Standard', description: 'New black/white + accent design language' }
    ],

    // Lively color themes (Standard DS only)
    livelyTheme,
    livelyHue,
    changeLivelyTheme,
    changeLivelyHue,
    livelyOptions: [
      { value: 'indigo',   label: 'Indigo',   tier: 'free',    native: '#a78bfa', complement: 'hsl(44,96%,56%)' },
      { value: 'mineral',  label: 'Mineral',  tier: 'free',    native: 'hsl(212,80%,64%)', complement: 'hsl(32,88%,60%)' },
      { value: 'forest',   label: 'Forest',   tier: 'free',    native: 'hsl(152,78%,55%)', complement: 'hsl(332,82%,68%)' },
      { value: 'ember',    label: 'Ember',    tier: 'premium', native: 'hsl(22,96%,60%)',  complement: 'hsl(198,84%,62%)' },
      { value: 'ocean',    label: 'Ocean',    tier: 'premium', native: 'hsl(210,84%,64%)', complement: 'hsl(34,90%,58%)' },
      { value: 'rose',     label: 'Rose',     tier: 'premium', native: 'hsl(342,82%,68%)', complement: 'hsl(162,72%,52%)' },
      { value: 'custom',   label: 'Custom',   tier: 'premium', native: null, complement: null },
    ],

    // Accent mode
    accentMode,
    changeAccentMode,

    // Grid style
    gridStyle,
    changeGridStyle,
    gridStyleOptions: [
      { value: 'crosshatch', label: 'Cross',      icon: 'crosshatch' },
      { value: 'dot',        label: 'Dots',       icon: 'dot' },
      { value: 'diagonal',   label: 'Lines',      icon: 'diagonal' },
      { value: 'x-hatch',    label: 'Crosshatch', icon: 'x-hatch' },
    ],

    // Grid animation
    gridAnimation,
    changeGridAnimation,
    gridAnimationOptions: [
      { value: 'none',     label: 'Static' },
      { value: 'reactive', label: 'Reactive' },
      { value: 'breathe',  label: 'Breathe' },
      { value: 'drift',    label: 'Drift' },
      { value: 'aurora',   label: 'Aurora' },
    ],

    // Grid boldness
    gridBoldness,
    changeGridBoldness,
    gridBoldnessOptions: [
      { value: 'low',    label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high',   label: 'High' },
    ],

    // Theme options for UI
    themeOptions: [
      { value: 'light', label: 'Light', description: 'Light mode' },
      { value: 'dark',  label: 'Dark',  description: 'Dark mode' },
      { value: 'auto',  label: 'System', description: 'Follow system' },
    ],
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
