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
    // Lively: load stored value as-is — the picker UI handles the premium gate.
    // TODO: enforce server-side when billing is fully wired.
    const storedLively = user?.preferences?.livelyTheme || 'indigo';
    setLivelyTheme(storedLively);
    setLivelyHue(typeof user?.preferences?.livelyHue === 'number' ? user.preferences.livelyHue : 220);
    setGridStyle(user?.preferences?.gridStyle || 'crosshatch');
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
      { value: 'indigo',   label: 'Indigo',   tier: 'free',    previewDark: '#a78bfa', previewLight: '#6f4ee6' },
      { value: 'obsidian', label: 'Obsidian', tier: 'free',    previewDark: 'hsl(270,22%,66%)', previewLight: 'hsl(268,30%,34%)' },
      { value: 'forest',   label: 'Forest',   tier: 'premium', previewDark: 'hsl(152,65%,48%)', previewLight: 'hsl(155,52%,30%)' },
      { value: 'ember',    label: 'Ember',    tier: 'premium', previewDark: 'hsl(18,100%,62%)', previewLight: 'hsl(18,78%,40%)' },
      { value: 'ocean',    label: 'Ocean',    tier: 'premium', previewDark: 'hsl(210,82%,62%)', previewLight: 'hsl(210,68%,38%)' },
      { value: 'rose',     label: 'Rose',     tier: 'premium', previewDark: 'hsl(342,82%,68%)', previewLight: 'hsl(342,62%,40%)' },
      { value: 'custom',   label: 'Custom',   tier: 'premium', previewDark: null, previewLight: null },
    ],

    // Grid style
    gridStyle,
    changeGridStyle,
    gridStyleOptions: [
      { value: 'crosshatch', label: 'Grid',     icon: 'crosshatch' },
      { value: 'dot',        label: 'Dots',     icon: 'dot' },
      { value: 'diagonal',   label: 'Lines',    icon: 'diagonal' },
      { value: 'none',       label: 'None',     icon: 'none' },
    ],

    // Theme options for UI
    themeOptions: [
      { value: 'light', label: 'Light', description: 'Light theme' },
      { value: 'dark', label: 'Dark', description: 'Dark theme' },
      { value: 'auto', label: 'Auto', description: 'Follow system preference' },
      { value: 'bw', label: 'B/W', description: 'High contrast' }
    ]
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
