import React, { useMemo } from 'react';
import { CalendarIcon, ActivityLogIcon } from '@radix-ui/react-icons';
import { useWeekUtils } from '../../hooks/useWeekUtils';

const WeeklyHeatmap = ({ habits, entries, timeRange }) => {
  const weekUtils = useWeekUtils();
  const heatmapData = useMemo(() => {
    if (!habits.length) return { weeks: [], maxActivity: 0, totalDays: 0 };

    const days = parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    // Generate weeks structure using user's preferred week start
    const weeks = [];
    let currentDate = new Date(startDate);
    
    // Adjust to start from user's preferred week start day
    const dayOfWeek = currentDate.getDay();
    const daysToSubtract = (dayOfWeek - weekUtils.weekStartDay + 7) % 7;
    currentDate.setDate(currentDate.getDate() - daysToSubtract);

    while (currentDate <= endDate) {
      const week = [];
      
      for (let i = 0; i < 7; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        let activity = 0;
        let completions = 0;
        let possible = 0;

        // Calculate activity for this day across all habits
        habits.forEach(habit => {
          const habitEntries = entries[habit._id] || {};
          const entry = habitEntries[dateStr];
          
          possible++;
          if (entry && entry.completed) {
            completions++;
            activity += 1;
          }
        });

        week.push({
          date: new Date(currentDate),
          dateStr,
          activity,
          completions,
          possible,
          isInRange: currentDate >= startDate && currentDate <= endDate,
          isToday: dateStr === new Date().toISOString().split('T')[0]
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      weeks.push(week);
    }

    // Find max activity for color scaling
    const maxActivity = Math.max(
      ...weeks.flat().map(day => day.activity),
      1
    );

    const totalDays = weeks.flat().filter(day => day.isInRange).length;

    return { weeks, maxActivity, totalDays };
  }, [habits, entries, timeRange]);

  const getActivityColor = (activity, maxActivity) => {
    if (activity === 0) return 'var(--color-surface-elevated)';
    
    const intensity = activity / maxActivity;
    if (intensity <= 0.25) return 'rgba(99, 102, 241, 0.3)';
    if (intensity <= 0.5) return 'rgba(99, 102, 241, 0.5)';
    if (intensity <= 0.75) return 'rgba(99, 102, 241, 0.7)';
    return 'rgba(99, 102, 241, 0.9)';
  };

  const getActivityLabel = (activity, possible) => {
    if (activity === 0) return 'No activity';
    if (activity === possible) return `Perfect day! ${activity}/${possible} habits`;
    return `${activity}/${possible} habits completed`;
  };

  const stats = useMemo(() => {
    const activeDays = heatmapData.weeks.flat()
      .filter(day => day.isInRange && day.activity > 0).length;
    
    const perfectDays = heatmapData.weeks.flat()
      .filter(day => day.isInRange && day.possible > 0 && day.activity === day.possible).length;

    const totalCompletions = heatmapData.weeks.flat()
      .filter(day => day.isInRange)
      .reduce((sum, day) => sum + day.completions, 0);

    return { activeDays, perfectDays, totalCompletions };
  }, [heatmapData]);

  if (!habits.length) {
    return (
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-semibold font-dmSerif text-[var(--color-text-primary)] mb-4">
          Activity Heatmap
        </h3>
        <div className="text-center py-12">
          <CalendarIcon className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)] font-outfit">
            Your habit activity will appear here as a heatmap
          </p>
        </div>
      </div>
    );
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="glass-card p-6 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold font-dmSerif text-[var(--color-text-primary)]">
          Activity Heatmap
        </h3>
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] font-outfit">
          <ActivityLogIcon className="w-4 h-4" />
          Last {timeRange}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-[var(--color-surface-elevated)]/30 rounded-lg">
          <div className="text-2xl font-bold font-dmSerif text-[var(--color-brand-400)]">
            {stats.activeDays}
          </div>
          <div className="text-xs text-[var(--color-text-tertiary)] font-outfit">
            Active Days
          </div>
        </div>
        <div className="text-center p-3 bg-[var(--color-surface-elevated)]/30 rounded-lg">
          <div className="text-2xl font-bold font-dmSerif text-[var(--color-success)]">
            {stats.perfectDays}
          </div>
          <div className="text-xs text-[var(--color-text-tertiary)] font-outfit">
            Perfect Days
          </div>
        </div>
        <div className="text-center p-3 bg-[var(--color-surface-elevated)]/30 rounded-lg">
          <div className="text-2xl font-bold font-dmSerif text-[var(--color-text-primary)]">
            {stats.totalCompletions}
          </div>
          <div className="text-xs text-[var(--color-text-tertiary)] font-outfit">
            Total Completions
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-[var(--color-surface-elevated)]/30 rounded-xl p-4 border border-[var(--color-border-primary)]/20">
        {/* Day labels */}
        <div className="flex mb-2">
          <div className="w-12"></div> {/* Space for week labels */}
          <div className="flex-1 flex max-w-[360px] mx-auto">
            {dayLabels.map(day => (
              <div key={day} className="flex-1 text-center text-xs text-[var(--color-text-tertiary)] font-outfit">
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap grid */}
        <div className="space-y-1">
          {heatmapData.weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex items-center">
              {/* Week label */}
              <div className="w-12 text-xs text-[var(--color-text-tertiary)] font-outfit pr-2">
                {week[0] && week[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              
              {/* Day squares */}
              <div className="flex-1 flex gap-1 max-w-[360px] mx-auto">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="aspect-square flex-1 rounded-sm border border-[var(--color-border-primary)]/10 relative group cursor-pointer transition-all duration-200 hover:scale-110"
                    style={{
                      backgroundColor: day.isInRange 
                        ? getActivityColor(day.activity, heatmapData.maxActivity)
                        : 'var(--color-surface-secondary)',
                      opacity: day.isInRange ? 1 : 0.3
                    }}
                  >
                    {/* Today indicator */}
                    {day.isToday && (
                      <div className="absolute inset-0 rounded-sm border-2 border-[var(--color-brand-400)]"></div>
                    )}
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--color-surface-primary)] text-xs text-[var(--color-text-primary)] px-2 py-1 rounded border border-[var(--color-border-primary)] whitespace-nowrap z-10">
                      <div className="font-semibold">
                        {day.date.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div>
                        {getActivityLabel(day.activity, day.possible)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-border-primary)]/20">
          <span className="text-xs text-[var(--color-text-tertiary)] font-outfit">
            Less active
          </span>
          <div className="flex items-center gap-1">
            {[0, 0.25, 0.5, 0.75, 1].map((intensity, index) => (
              <div
                key={index}
                className="w-3 h-3 rounded-sm border border-[var(--color-border-primary)]/10"
                style={{
                  backgroundColor: intensity === 0 
                    ? 'var(--color-surface-elevated)' 
                    : `rgba(99, 102, 241, ${0.3 + intensity * 0.6})`
                }}
              ></div>
            ))}
          </div>
          <span className="text-xs text-[var(--color-text-tertiary)] font-outfit">
            More active
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyHeatmap;