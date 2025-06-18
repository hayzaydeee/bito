import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { 
  CalendarIcon, 
  DoubleArrowUpIcon,
  CheckCircledIcon,
  TargetIcon,
  PlusIcon,
  PlayIcon
} from '@radix-ui/react-icons';

const WelcomeCard = memo(({ userName = "Alex" }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Memoized calculations to prevent unnecessary re-renders
  const timeData = useMemo(() => {
    const timeOfDay = currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 18 ? 'afternoon' : 'evening';
    const greeting = `Good ${timeOfDay}`;
    
    const currentDate = currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    const timeString = currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return { greeting, currentDate, timeString };
  }, [currentTime]);

  // Memoized stats to prevent unnecessary recalculations
  const stats = useMemo(() => ({
    completed: 7,
    streak: 15,
    progress: 89,
    todayTotal: 10
  }), []);

  const handleAddHabit = useCallback(() => {
    console.log('Add habit clicked');
  }, []);

  const handleQuickAction = useCallback(() => {
    console.log('Quick action clicked');
  }, []);

  return (
    <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-500)]/3 via-[var(--color-brand-400)]/2 to-transparent"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--color-brand-400)]/8 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
      </div>
      
      <div className="relative z-10">
        {/* Header - More Compact */}
        <div className="flex items-center justify-between mb-6">
          {/* Left - Greeting */}
          <div>            <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-brand-400)] bg-clip-text text-transparent font-dmSerif leading-tight mb-1">
              {timeData.greeting}, {userName}! 
            </h1>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-[var(--color-brand-400)]" />
                <span className="font-outfit text-[var(--color-text-secondary)] font-medium">
                  {timeData.currentDate}
                </span>
              </div>
              <div className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)]"></div>
              <span className="font-outfit text-[var(--color-text-tertiary)] font-medium tabular-nums">
                {timeData.timeString}
              </span>
            </div>
          </div>

          {/* Right - Quick Actions */}          <div className="flex items-center gap-2">
            <button 
              onClick={handleAddHabit}
              className="group flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-[var(--color-brand-500)]/25"
            >
              <PlusIcon className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white font-outfit">Add Habit</span>
            </button>
            <button 
              onClick={handleQuickAction}
              className="group p-2.5 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-all duration-200 hover:scale-105"
            >
              <PlayIcon className="w-4 h-4 text-[var(--color-brand-400)] group-hover:text-[var(--color-brand-500)]" />
            </button>
          </div>
        </div>

        {/* Progress Overview - Horizontal Layout */}
        <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)]/30 backdrop-blur-sm rounded-xl border border-[var(--color-border-primary)]/20">
          {/* Today's Progress */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-success)]/20 to-[var(--color-success)]/10 border border-[var(--color-success)]/20 flex items-center justify-center">
                <CheckCircledIcon className="w-5 h-5 text-[var(--color-success)]" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-success)] rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">{stats.completed}</span>
              </div>
            </div>
            <div>
              <div className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">
                {stats.completed} of {stats.todayTotal}
              </div>
              <div className="text-xs font-outfit text-[var(--color-text-tertiary)]">
                habits completed today
              </div>
            </div>
          </div>

          {/* Streak & Progress */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DoubleArrowUpIcon className="w-4 h-4 text-[var(--color-brand-400)]" />
                <span className="text-xl font-bold font-dmSerif text-[var(--color-brand-400)]">
                  {stats.streak}
                </span>
              </div>
              <div className="text-xs font-outfit text-[var(--color-text-tertiary)]">
                day streak
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TargetIcon className="w-4 h-4 text-[var(--color-brand-500)]" />
                <span className="text-xl font-bold font-dmSerif text-[var(--color-brand-500)]">
                  {stats.progress}%
                </span>
              </div>
              <div className="text-xs font-outfit text-[var(--color-text-tertiary)]">
                weekly goal
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-outfit text-[var(--color-text-secondary)]">
              Daily Progress
            </span>
            <span className="text-sm font-outfit font-medium text-[var(--color-brand-500)]">
              {Math.round((stats.completed / stats.todayTotal) * 100)}%
            </span>
          </div>
          <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-500)] h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(stats.completed / stats.todayTotal) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>  );
});

WelcomeCard.displayName = 'WelcomeCard';

export default WelcomeCard;
