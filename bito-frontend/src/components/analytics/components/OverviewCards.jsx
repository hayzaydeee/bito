import React from 'react';
import { 
  TargetIcon, 
  CheckCircledIcon, 
  ArrowUpIcon,
  ActivityLogIcon,
  DoubleArrowUpIcon,
  CalendarIcon
} from '@radix-ui/react-icons';

const OverviewCards = ({ data, timeRange, className = '' }) => {
  const cards = [
    {
      title: 'Total Habits',
      value: data.totalHabits,
      icon: TargetIcon,
      color: 'brand',
      suffix: '',
      description: 'habits in your collection'
    },
    {
      title: 'Completed',
      value: data.totalCompletions,
      icon: CheckCircledIcon,
      color: 'success',
      suffix: '',
      description: `times in the last ${timeRange}`
    },
    {
      title: 'Success Rate',
      value: data.averageCompletionRate,
      icon: ArrowUpIcon,
      color: 'info',
      suffix: '%',
      description: 'average completion rate'
    },
    {
      title: 'Active Habits',
      value: data.activeHabits,
      icon: ActivityLogIcon,
      color: 'warning',
      suffix: '',
      description: 'habits with recent activity'
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      brand: {
        icon: 'text-[var(--color-brand-400)]',
        bg: 'from-[var(--color-brand-500)]/10 to-[var(--color-brand-600)]/5',
        border: 'border-[var(--color-brand-400)]/20'
      },
      success: {
        icon: 'text-[var(--color-success)]',
        bg: 'from-[var(--color-success)]/10 to-[var(--color-success)]/5',
        border: 'border-[var(--color-success)]/20'
      },
      info: {
        icon: 'text-[var(--color-info)]',
        bg: 'from-[var(--color-info)]/10 to-[var(--color-info)]/5',
        border: 'border-[var(--color-info)]/20'
      },
      warning: {
        icon: 'text-[var(--color-warning)]',
        bg: 'from-[var(--color-warning)]/10 to-[var(--color-warning)]/5',
        border: 'border-[var(--color-warning)]/20'
      }
    };
    return colorMap[color] || colorMap.brand;
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        const colors = getColorClasses(card.color);
        
        return (
          <div 
            key={card.title}
            className="bg-[var(--color-surface-elevated)]/50 backdrop-blur-sm p-4 rounded-xl border border-[var(--color-border-primary)]/30 relative overflow-hidden group hover:scale-105 transition-all duration-300"
          >
            {/* Background Pattern */}
            <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg}`}></div>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${colors.bg} rounded-full -translate-y-12 translate-x-12`}></div>
            
            <div className="relative z-10">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.bg} border ${colors.border} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>

              {/* Value */}
              <div className="mb-2">
                <span className="text-2xl font-bold font-dmSerif text-[var(--color-text-primary)]">
                  {card.value.toLocaleString()}
                </span>
                {card.suffix && (
                  <span className="text-xl font-bold font-dmSerif text-[var(--color-text-secondary)] ml-1">
                    {card.suffix}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-xs font-semibold text-[var(--color-text-primary)] font-outfit mb-1">
                {card.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-[var(--color-text-tertiary)] font-outfit leading-tight">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OverviewCards;