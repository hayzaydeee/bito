import React from 'react';
import { Flex, Text, Button, Avatar } from '@radix-ui/themes';
import { PersonIcon, GearIcon, BellIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';

const WelcomeBar = ({ userName = "User" }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="h-16 px-6 border-b border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] backdrop-blur-xl bg-opacity-90 relative z-20">
      <Flex align="center" justify="between" className="h-full">
        {/* Left Section - Greeting */}
        <div className="flex flex-col">
          <Text className="text-lg font-semibold gradient-text" style={{ fontFamily: 'var(--font-dmSerif)' }}>
            Welcome back, {userName}
          </Text>
          <Text className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {currentDate}
          </Text>
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:flex items-center rounded-full px-4 py-2 min-w-80 border transition-colors"
             style={{ 
               backgroundColor: 'var(--color-surface-secondary)', 
               borderColor: 'var(--color-border-primary)' 
             }}>
          <MagnifyingGlassIcon className="w-4 h-4 mr-3" style={{ color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search habits, analytics, or settings..."
            className="bg-transparent border-none outline-none flex-1 text-sm"
            style={{ 
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-outfit)'
            }}
          />
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs rounded border"
               style={{ 
                 backgroundColor: 'var(--color-surface-hover)',
                 color: 'var(--color-text-tertiary)',
                 borderColor: 'var(--color-border-primary)'
               }}>
            ⌘K
          </kbd>
        </div>

        {/* Right Section - Actions */}
        <Flex align="center" gap="3">
          {/* Quick Stats */}
          <div className="hidden lg:flex items-center gap-4 mr-4">
            <div className="text-center">
              <div className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>5</div>
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Today</div>
            </div>
            <div className="w-px h-8" style={{ backgroundColor: 'var(--color-border-primary)' }}></div>
            <div className="text-center">
              <div className="text-sm font-semibold" style={{ color: 'var(--color-brand-400)' }}>12</div>
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Streak</div>
            </div>
          </div>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="2"
            className="relative hover:bg-[var(--color-surface-hover)]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <BellIcon className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-brand-500)' }}>
              <span className="text-xs text-white font-bold">2</span>
            </span>
          </Button>

          {/* Settings */}
          <Button 
            variant="ghost" 
            size="2"
            className="hover:bg-[var(--color-surface-hover)]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <GearIcon className="w-5 h-5" />
          </Button>

          {/* User Avatar */}
          <div className="flex items-center gap-3 ml-2">
            <Avatar
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}&backgroundColor=6366f1`}
              alt={userName}
              fallback={userName.charAt(0).toUpperCase()}
              size="2"
              className="ring-2 ring-opacity-50"
              style={{ ringColor: 'var(--color-brand-500)' }}
            />
            <div className="hidden sm:block">
              <Text className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {userName}
              </Text>
              <Text className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Habit Tracker
              </Text>
            </div>
          </div>
        </Flex>
      </Flex>
    </div>
  );
};

export default WelcomeBar;