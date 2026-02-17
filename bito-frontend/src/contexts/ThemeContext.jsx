import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const { user } = useAuth();
  const [theme, setTheme] = useState('dark'); // Default to dark
  const [systemTheme, setSystemTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);

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

  // Load theme from user preferences
  useEffect(() => {
    if (user?.preferences?.theme) {
      setTheme(user.preferences.theme);
    } else {
      // Default to system preference if no user preference
      setTheme('auto');
    }
    setIsLoading(false);
  }, [user]);

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

    // Update PWA theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const colors = { light: '#FAFBFF', dark: '#0D0A1A', bw: '#000000' };
      metaThemeColor.setAttribute('content', colors[effectiveTheme] || '#0D0A1A');
    }
  }, [theme, systemTheme]);

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
      } catch (error) {
        console.error('Failed to save theme preference:', error);
        // Revert on error
        setTheme(user.preferences?.theme || 'auto');
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
    
    // Theme options for UI
    themeOptions: [
      { value: 'light', label: '☀️ Light', description: 'Light theme' },
      { value: 'dark', label: '🌙 Dark', description: 'Dark theme' },
      { value: 'auto', label: '🖥️ Auto', description: 'Follow system preference' },
      { value: 'bw', label: '◐ B/W', description: 'High contrast' }
    ]
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
