import React from 'react';

export const EmptyState = () => {
  return (
    <div className="empty-state w-full h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-4">
        {/* Empty state icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center mb-4">
          <span className="text-2xl">📋</span>
        </div>
        
        {/* Empty state message */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-outfit">
            No Habits Yet
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] font-outfit leading-relaxed">
            Start tracking your daily habits by importing your data or adding your first habit.
          </p>
        </div>
        
        {/* Call to action */}
        <div className="space-y-3 pt-4">
          <div className="text-xs text-[var(--color-text-tertiary)] font-outfit">
            💡 Tip: Use the "📄 Import CSV" button to quickly import your existing habit data
          </div>
        </div>
      </div>
    </div>
  );
};
