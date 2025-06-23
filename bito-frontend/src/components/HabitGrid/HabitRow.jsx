import React, { memo } from 'react';
import { HabitCheckbox } from './HabitCheckbox.jsx';

export const HabitRow = memo(({ 
  habit, 
  weekDates, 
  completions, 
  onToggle 
}) => {
  return (
    <div className="habit-row bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border-primary)] overflow-hidden">
      <div className="flex items-center">
        {/* Habit Info */}
        <div className="habit-info flex items-center gap-3 p-4 min-w-[200px] bg-[var(--color-surface-secondary)]/30">
          <span className="text-xl">{habit.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[var(--color-text-primary)] truncate">
              {habit.name}
            </h3>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Streak: {getHabitStreak(habit.id, completions, weekDates)} days
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
                habitId={habit.id}
                date={date}
                isCompleted={completions.has(`${date}_${habit.id}`)}
                isToday={isToday}
                color={habit.color}
                onToggle={() => onToggle(habit.id, date)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Helper function to calculate streak
const getHabitStreak = (habitId, completions, weekDates) => {
  let streak = 0;
  // Start from most recent date and work backwards
  const sortedDates = [...weekDates].reverse();
  
  for (const { date } of sortedDates) {
    if (completions.has(`${date}_${habitId}`)) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

HabitRow.displayName = 'HabitRow';
