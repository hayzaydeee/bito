import React from 'react';
import { 
  PersonIcon,
  BarChartIcon,
  TargetIcon,
  ActivityLogIcon
} from '@radix-ui/react-icons';

const GroupOverviewWidget = ({ 
  workspaceData,
  className = "",
  ...props 
}) => {
  if (!workspaceData) {
    return (
      <div className={`bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-2xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-[var(--color-surface-hover)] rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-[var(--color-surface-hover)] rounded w-1/2"></div>
                <div className="h-8 bg-[var(--color-surface-hover)] rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Active Habits",
      value: workspaceData.totalActiveHabits || 0,
      icon: TargetIcon,
      color: "blue"
    },
    {
      label: "Active Members", 
      value: workspaceData.activeMembers || 0,
      icon: PersonIcon,
      color: "green"
    },
    {
      label: "Avg Completion",
      value: `${Math.round(workspaceData.averageCompletionRate || 0)}%`,
      icon: BarChartIcon,
      color: "purple"
    },
    {
      label: "Total Entries",
      value: workspaceData.totalEntries || 0,
      icon: ActivityLogIcon,
      color: "orange"
    }
  ];

  return (
    <div className={`bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-2xl p-6 ${className}`}>
      <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif mb-6">
        Group Overview
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30 flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
              <p className="text-xs font-medium text-[var(--color-text-secondary)] font-outfit mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupOverviewWidget;
