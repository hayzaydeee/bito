import React, { useMemo } from "react";
import { useHabits } from "../../../../contexts/HabitContext";
import { habitUtils } from "../../../../utils/habitLogic.js";
import { HabitCheckbox } from "../../../HabitGrid/HabitCheckbox.jsx";

export const TableView = ({ startDate, endDate = null }) => {
  // Get data from HabitContext
  const { habits, entries, loading, error } = useHabits();

  // Memoize the start date to prevent infinite re-renders
  const memoizedStartDate = useMemo(() => {
    return typeof startDate === 'string' ? startDate : startDate?.toISOString?.()?.split('T')[0];
  }, [startDate]);

  // Generate date range for the week
  const dates = useMemo(() => {
    if (!memoizedStartDate) return [];
    return habitUtils.generateDateRange(memoizedStartDate, endDate);
  }, [memoizedStartDate, endDate]);
  // Memoize completion checks
  const isCompletedMemo = useMemo(() => {
    const memo = new Map();
    return (habitId, date) => {
      const key = `${habitId}_${date}`;
      if (!memo.has(key)) {
        const habitEntries = entries[habitId];
        const entry = habitEntries && habitEntries[date];
        // Only return true if entry exists AND is completed
        memo.set(key, !!(entry && entry.completed));
      }
      return memo.get(key);
    };
  }, [entries]);

  if (!memoizedStartDate) {
    return <div>Invalid date provided</div>;
  }

  if (habits.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No habits yet. Add your first habit to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-8 gap-0">
          <div className="p-3 text-sm font-medium text-gray-900 border-r border-gray-200">
            Habit
          </div>
          {dates.map((date) => {
            const dayName = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
            const dayNumber = new Date(date + 'T00:00:00').getDate();
            return (
              <div key={date} className="p-2 text-center border-r border-gray-200 last:border-r-0">
                <div className="text-xs font-medium text-gray-900">{dayName}</div>
                <div className="text-xs text-gray-500">{dayNumber}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">        {habits.map((habit) => (
          <div key={habit._id} className="grid grid-cols-8 gap-0 hover:bg-gray-50">
            {/* Habit Name Column */}
            <div className="p-3 border-r border-gray-200 flex items-center">
              <span className="text-lg mr-2" role="img" aria-label={habit.name}>
                {habit.icon}
              </span>
              <span className="text-sm font-medium text-gray-900 truncate">
                {habit.name}
              </span>
            </div>

            {/* Checkbox Columns */}            {dates.map((date) => (
              <div key={`${habit._id}-${date}`} className="p-2 flex justify-center items-center border-r border-gray-200 last:border-r-0">
                <HabitCheckbox
                  habitId={habit._id}
                  date={date}
                  isCompleted={isCompletedMemo(habit._id, date)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Stats Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-3">
        <div className="grid grid-cols-8 gap-0 text-xs text-gray-600">
          <div className="font-medium">Total</div>          {dates.map((date) => {
            const completedCount = habits.filter(habit => 
              isCompletedMemo(habit._id, date)
            ).length;
            const percentage = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
            
            return (
              <div key={`stats-${date}`} className="text-center">
                <div>{completedCount}/{habits.length}</div>
                <div className="text-gray-500">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
