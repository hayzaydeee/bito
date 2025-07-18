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
    const effectiveTheme = theme === 'auto' ? systemTheme : theme;
    
    // Remove existing theme attributes
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('theme-light', 'theme-dark');
    
    // Apply new theme
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.body.classList.add(`theme-${effectiveTheme}`);
    
    // Update Radix UI theme appearance
    const radixThemeRoot = document.querySelector('[data-accent-color]');
    if (radixThemeRoot) {
      radixThemeRoot.setAttribute('data-appearance', effectiveTheme);
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

  const value = {
    theme,
    systemTheme,
    effectiveTheme: getEffectiveTheme(),
    isLoading,
    changeTheme,
    
    // Theme options for UI
    themeOptions: [
      { value: 'light', label: '☀️ Light', description: 'Light theme' },
      { value: 'dark', label: '🌙 Dark', description: 'Dark theme' },
      { value: 'auto', label: '🖥️ Auto', description: 'Follow system preference' }
    ]
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
