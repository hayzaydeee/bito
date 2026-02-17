import React, { useState } from 'react';
import { SunIcon, MoonIcon, DesktopIcon, Half2Icon } from '@radix-ui/react-icons';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeSwitcher = ({ compact = false }) => {
  const { theme, changeTheme, themeOptions } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const getCurrentThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon className="w-4 h-4" />;
      case 'dark':
        return <MoonIcon className="w-4 h-4" />;
      case 'auto':
        return <DesktopIcon className="w-4 h-4" />;
      case 'bw':
        return <Half2Icon className="w-4 h-4" />;
      default:
        return <MoonIcon className="w-4 h-4" />;
    }
  };

  const handleThemeChange = async (newTheme) => {
    await changeTheme(newTheme);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
          aria-label="Switch theme"
          title={`Current theme: ${theme}`}
        >
          <div className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            {getCurrentThemeIcon()}
          </div>
        </button>

        {/* Theme Dropdown */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <div className="absolute  top-full right-0 mt-2 w-36 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)] rounded-lg shadow-lg z-50 py-1">
              {themeOptions.map((option) => {
                const icons = { light: '☀️', dark: '🌙', auto: '🖥️', bw: '◐' };
                return (
                  <button
                    key={option.value}
                    onClick={() => handleThemeChange(option.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      theme === option.value
                        ? 'bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)]'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                    }`}
                  >
                    <span className="text-base font-normal">
                      {icons[option.value] || '🖥️'}
                    </span>
                    <span className="text-xs font-medium font-outfit">
                      {option.label.replace(/^[^\s]+\s/, '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Full theme switcher for settings page
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-surface-hover)]/30">
      {themeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => changeTheme(option.value)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium font-outfit transition-all ${
            theme === option.value
              ? 'bg-[var(--color-brand-500)] text-white shadow-lg'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
