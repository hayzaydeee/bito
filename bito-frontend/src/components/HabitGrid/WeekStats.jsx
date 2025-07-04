import React from 'react';

export const WeekStats = ({ stats }) => {
  const { completionRate, perfectDays, completedCells, averageCompletion } = stats;

  return (
    <div className="week-stats mt-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3 border border-[var(--color-border-primary)]">
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--color-brand-400)] font-dmSerif">
              {completionRate}%
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] font-outfit">
              Overall
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3 border border-[var(--color-border-primary)]">
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--color-success)] font-dmSerif">
              {perfectDays}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] font-outfit">
              Perfect Days
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3 border border-[var(--color-border-primary)]">
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif">
              {completedCells}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] font-outfit">
              Completed
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3 border border-[var(--color-border-primary)]">
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--color-warning)] font-dmSerif">
              {averageCompletion}%
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] font-outfit">
              Average
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
