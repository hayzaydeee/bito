import React, { useState } from 'react';
import { Flex, Text, Button } from '@radix-ui/themes';
import { 
  DashboardIcon, 
  BarChartIcon, 
  GearIcon,
  CalendarIcon,
  TargetIcon,
  LightningBoltIcon,
  ActivityLogIcon,
  HamburgerMenuIcon,
  Cross1Icon
} from '@radix-ui/react-icons';

const VerticalMenu = ({ currentPage, onPageChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, description: 'Overview & insights' },
    { id: 'habits', label: 'Habits', icon: TargetIcon, description: 'Manage your habits' },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon, description: 'Track progress' },
    { id: 'analytics', label: 'Analytics', icon: BarChartIcon, description: 'Detailed reports' },
    { id: 'quick-actions', label: 'Quick Actions', icon: LightningBoltIcon, description: 'Fast completions' },
    { id: 'activity', label: 'Activity', icon: ActivityLogIcon, description: 'Recent changes' },
  ];

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: GearIcon, description: 'Preferences' },
  ];
  const renderMenuItem = (item, isBottom = false) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;
    
    if (isCollapsed) {
      return (
        <div key={item.id} className="group relative">
          <Button
            variant="ghost"
            size="3"
            className={`w-full justify-center p-3 rounded-xl transition-all duration-200 ${
              isActive 
                ? 'bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-700)] text-white shadow-lg' 
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'
            }`}
            onClick={() => onPageChange(item.id)}
            title={item.label}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[var(--color-text-accent)]'}`} />
          </Button>
          
          {/* Active indicator */}
          {isActive && (
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r-full"
                 style={{ backgroundColor: 'var(--color-brand-300)' }}></div>
          )}
        </div>
      );
    }
    
    return (
      <div key={item.id} className="group relative">
        <Button
          variant="ghost"
          size="3"
          className={`w-full justify-start p-3 rounded-xl transition-all duration-200 ${
            isActive 
              ? 'bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-700)] text-white shadow-lg' 
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'
          }`}
          onClick={() => onPageChange(item.id)}
        >
          <div className="flex items-center gap-3 w-full">
            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[var(--color-text-accent)]'}`} />
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm">{item.label}</span>
              <span className={`text-xs ${
                isActive 
                  ? 'text-blue-100' 
                  : 'text-[var(--color-text-tertiary)]'
              }`}>
                {item.description}
              </span>
            </div>
          </div>
        </Button>
        
        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r-full"
               style={{ backgroundColor: 'var(--color-brand-300)' }}></div>
        )}
      </div>
    );
  };
  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-72'} h-full min-h-[calc(100vh-4rem)] p-4 relative z-10 transition-all duration-300`}
         style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <Flex direction="column" className="h-full">
        {/* Toggle Button */}
        <div className="mb-4 flex justify-end">
          <Button
            variant="ghost"
            size="2"
            className="text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <HamburgerMenuIcon className="w-4 h-4" /> : <Cross1Icon className="w-4 h-4" />}
          </Button>
        </div>

        {/* Logo/Brand Section */}
        {!isCollapsed && (
          <div className="mb-8 p-4 rounded-2xl"
               style={{ backgroundColor: 'var(--color-surface-elevated)' }}>
            <Flex direction="column" gap="1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)] flex items-center justify-center animate-glow">
                  <TargetIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <Text className="text-lg font-bold gradient-text" style={{ fontFamily: 'var(--font-dmSerif)' }}>
                    Bito
                  </Text>
                  <Text className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    Habit Tracker
                  </Text>
                </div>
              </div>
              <Text className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Build better habits, one day at a time
              </Text>
            </Flex>
          </div>
        )}

        {/* Collapsed Logo */}
        {isCollapsed && (
          <div className="mb-8 flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)] flex items-center justify-center animate-glow">
              <TargetIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <div className="flex-1">
          <div className="mb-6">
            {!isCollapsed && (
              <Text className="text-xs font-semibold uppercase tracking-wider mb-3 px-3"
                    style={{ color: 'var(--color-text-tertiary)' }}>
                Navigation
              </Text>
            )}
            <Flex direction="column" gap="1">
              {menuItems.map((item) => renderMenuItem(item))}
            </Flex>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={`border-t pt-4 ${isCollapsed ? 'border-t-0 pt-0' : ''}`}
             style={{ borderColor: 'var(--color-border-primary)' }}>
          {!isCollapsed && (
            <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-[var(--color-brand-900)] to-[var(--color-brand-800)] border"
                 style={{ borderColor: 'var(--color-brand-600)' }}>
              <div className="flex items-center justify-between mb-2">
                <Text className="text-sm font-medium text-white">Today's Progress</Text>
                <Text className="text-xs text-blue-200">83%</Text>
              </div>
              <div className="w-full bg-blue-900 rounded-full h-2">
                <div className="bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-300)] h-2 rounded-full transition-all duration-500"
                     style={{ width: '83%' }}></div>
              </div>
              <Text className="text-xs text-blue-200 mt-1">
                5 of 6 habits completed
              </Text>
            </div>
          )}

          {!isCollapsed && (
            <Text className="text-xs font-semibold uppercase tracking-wider mb-3 px-3"
                  style={{ color: 'var(--color-text-tertiary)' }}>
              More
            </Text>
          )}
          <Flex direction="column" gap="1">
            {bottomItems.map((item) => renderMenuItem(item, true))}
          </Flex>
        </div>
      </Flex>
    </div>
  );
};

export default VerticalMenu;
