import React, { memo } from 'react';
import { HabitCheckbox } from './HabitCheckbox.jsx';
import { IconButton } from '@radix-ui/themes';
import { Pencil1Icon } from '@radix-ui/react-icons';
import { useHabits } from '../../contexts/HabitContext';

export const HabitRow = memo(({ 
  habit, 
  weekDates, 
  entries = {}, 
  onToggle,
  onEditHabit
}) => {
  const { isWorkspaceHabit } = useHabits();
  const isFromWorkspace = isWorkspaceHabit(habit);

  return (
    <div className="habit-row bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border-primary)] overflow-hidden">
      <div className="flex items-center">
        {/* Habit Info */}
        <div className="habit-info flex items-center gap-3 p-4 min-w-[200px] bg-[var(--color-surface-secondary)]/30">
          <span className="text-xl">{habit.icon || '✓'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-[var(--color-text-primary)] truncate">
                {habit.name}
              </h3>
              {isFromWorkspace && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  📊 Group
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Streak: {getHabitStreak(entries, weekDates)} days
              {isFromWorkspace && habit.workspaceHabitId && (
                <span className="ml-2 opacity-75">• From workspace</span>
              )}
            </p>
          </div>
          {onEditHabit && (
            <IconButton
              variant="ghost"
              size="1"
              color="gray"
              onClick={(e) => {
                e.stopPropagation();
                onEditHabit(habit);
              }}
            >
              <Pencil1Icon />
            </IconButton>
          )}
        </div>

        {/* Checkboxes */}
        <div className="habit-checkboxes flex flex-1 divide-x divide-[var(--color-border-primary)]">
          {weekDates.map(({ date, isToday, shortDay }) => (
            <div key={date} className="flex-1 p-2 text-center">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1 font-medium">
                {shortDay}
              </div>
              <HabitCheckbox
                habitId={habit._id ? String(habit._id) : null}
                date={date}
                isCompleted={!!entries[date]}
                isToday={isToday}
                color={habit.color || '#6366f1'}
                onToggle={() => {
                  const habitId = habit._id ? String(habit._id) : null;
                  if (habitId) onToggle(habitId, date);
                }}
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
