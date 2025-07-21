import React from 'react';

export const WeekHeader = ({ dates }) => {
  return (
    <div className="week-header mb-4">
      <div className="flex items-center">
        {/* Spacer for habit names */}
        <div className="min-w-[200px] p-4">
          <h3 className="font-semibold text-[var(--color-text-primary)]">
            Habits
          </h3>
        </div>

        {/* Day headers */}
        <div className="flex flex-1 divide-x divide-[var(--color-border-primary)]">
          {dates.map(({ date, dayName, shortDay, isToday }) => (
            <div key={date} className="flex-1 p-2 text-center">
              <div className={`font-medium ${
                isToday 
                  ? 'text-[var(--color-brand-500)]' 
                  : 'text-[var(--color-text-primary)]'
              }`}>
                {shortDay}
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)]">
                {new Date(date).getDate()}
              </div>
              {isToday && (
                <div className="text-xs text-[var(--color-brand-500)] font-bold mt-1">
                  TODAY
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
