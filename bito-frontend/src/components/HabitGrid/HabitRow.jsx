import React, { memo } from 'react';
import { HabitCheckbox } from './HabitCheckbox.jsx';

export const HabitRow = memo(({ 
  habit, 
  weekDates, 
  entries = {}, 
  onToggle 
}) => {
  return (
    <div className="habit-row bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border-primary)] overflow-hidden">
      <div className="flex items-center">
        {/* Habit Info */}
        <div className="habit-info flex items-center gap-3 p-4 min-w-[200px] bg-[var(--color-surface-secondary)]/30">
          <span className="text-xl">{habit.icon || '✓'}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[var(--color-text-primary)] truncate">
              {habit.name}
            </h3>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Streak: {getHabitStreak(entries, weekDates)} days
            </p>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="habit-checkboxes flex flex-1 divide-x divide-[var(--color-border-primary)]">
          {weekDates.map(({ date, isToday, shortDay }) => (
            <div key={date} className="flex-1 p-2 text-center">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1 font-medium">
                {shortDay}
              </div>
              <HabitCheckbox
                habitId={habit._id}
                date={date}
                isCompleted={!!entries[date]}
                isToday={isToday}
                color={habit.color || '#6366f1'}
                onToggle={() => onToggle(habit._id, date)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Helper function to calculate streak
const getHabitStreak = (entries, weekDates) => {
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  
  // Start from today and go backwards
  const sortedDates = weekDates
    .map(d => d.date)
    .filter(date => date <= today)
    .sort((a, b) => new Date(b) - new Date(a));
  
  for (const date of sortedDates) {
    if (entries[date]) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

HabitRow.displayName = 'HabitRow';
