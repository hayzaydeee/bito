import React, { useMemo } from 'react';
import { BarChartIcon, ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';

const CompletionRateChart = ({ habits, entries, timeRange }) => {
  const chartData = useMemo(() => {
    if (!habits.length) return { weeklyRates: [], trend: 0, labels: [] };

    const days = parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    // Group by weeks
    const weeks = [];
    let currentWeekStart = new Date(startDate);
    
    while (currentWeekStart <= endDate) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > endDate) weekEnd.setTime(endDate.getTime());

      weeks.push({
        start: new Date(currentWeekStart),
        end: new Date(weekEnd),
        label: currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });

      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    const weeklyRates = weeks.map(week => {
      let totalCompletions = 0;
      let totalPossible = 0;

      habits.forEach(habit => {
        const habitEntries = entries[habit._id] || {};
        
        for (let d = new Date(week.start); d <= week.end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const entry = habitEntries[dateStr];
          
          totalPossible++;
          if (entry && entry.completed) {
            totalCompletions++;
          }
        }
      });

      return {
        week: week.label,
        rate: totalPossible > 0 ? (totalCompletions / totalPossible) * 100 : 0,
        completions: totalCompletions,
        possible: totalPossible
      };
    });

    // Calculate trend
    const trend = weeklyRates.length >= 2 
      ? weeklyRates[weeklyRates.length - 1].rate - weeklyRates[weeklyRates.length - 2].rate
      : 0;

    return {
      weeklyRates,
      trend,
      labels: weeklyRates.map(w => w.week)
    };
  }, [habits, entries, timeRange]);

  const averageRate = useMemo(() => {
    if (!chartData.weeklyRates.length) return 0;
    return chartData.weeklyRates.reduce((sum, week) => sum + week.rate, 0) / chartData.weeklyRates.length;
  }, [chartData]);

  if (!habits.length) {
    return (
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-semibold font-dmSerif text-[var(--color-text-primary)] mb-4">
          Completion Rates
        </h3>
        <div className="text-center py-12">
          <BarChartIcon className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)] font-outfit">
            Start tracking habits to see your completion trends
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold font-dmSerif text-[var(--color-text-primary)]">
          Completion Rates
        </h3>
        <div className="flex items-center gap-2">
          {chartData.trend > 0 ? (
            <ArrowUpIcon className="w-4 h-4 text-[var(--color-success)]" />
          ) : chartData.trend < 0 ? (
            <ArrowDownIcon className="w-4 h-4 text-[var(--color-error)]" />
          ) : (
            <BarChartIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
          )}
          <span className={`text-sm font-medium font-outfit ${
            chartData.trend > 0 
              ? 'text-[var(--color-success)]' 
              : chartData.trend < 0 
                ? 'text-[var(--color-error)]' 
                : 'text-[var(--color-text-secondary)]'
          }`}>
            {chartData.trend > 0 ? '+' : ''}{chartData.trend.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-[var(--color-surface-elevated)]/30 rounded-lg">
          <div className="text-2xl font-bold font-dmSerif text-[var(--color-brand-400)]">
            {averageRate.toFixed(1)}%
          </div>
          <div className="text-xs text-[var(--color-text-tertiary)] font-outfit">
            Average Rate
          </div>
        </div>
        <div className="text-center p-3 bg-[var(--color-surface-elevated)]/30 rounded-lg">
          <div className="text-2xl font-bold font-dmSerif text-[var(--color-text-primary)]">
            {chartData.weeklyRates.reduce((sum, w) => sum + w.completions, 0)}
          </div>
          <div className="text-xs text-[var(--color-text-tertiary)] font-outfit">
            Total Completions
          </div>
        </div>
        <div className="text-center p-3 bg-[var(--color-surface-elevated)]/30 rounded-lg">
          <div className="text-2xl font-bold font-dmSerif text-[var(--color-text-primary)]">
            {chartData.weeklyRates.length}
          </div>
          <div className="text-xs text-[var(--color-text-tertiary)] font-outfit">
            Weeks Tracked
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="relative h-48 bg-[var(--color-surface-elevated)]/30 rounded-xl p-4 border border-[var(--color-border-primary)]/20">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-[var(--color-text-tertiary)] font-outfit">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>

        {/* Bars */}
        <div className="ml-8 h-full pb-8 flex items-end justify-between gap-2">
          {chartData.weeklyRates.map((week, index) => (
            <div key={index} className="flex-1 flex flex-col items-center group">
              {/* Bar */}
              <div 
                className="w-full bg-gradient-to-t from-[var(--color-brand-600)] to-[var(--color-brand-400)] rounded-t-md transition-all duration-300 hover:from-[var(--color-brand-500)] hover:to-[var(--color-brand-300)] relative"
                style={{ height: `${week.rate}%` }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--color-surface-primary)] text-xs text-[var(--color-text-primary)] px-2 py-1 rounded border border-[var(--color-border-primary)] whitespace-nowrap">
                  {week.rate.toFixed(1)}% ({week.completions}/{week.possible})
                </div>
              </div>
              
              {/* Week label */}
              <div className="text-xs text-[var(--color-text-tertiary)] font-outfit mt-2 transform -rotate-45 origin-center">
                {week.week}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Breakdown */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] font-outfit mb-3">
          Weekly Breakdown
        </h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {chartData.weeklyRates.slice().reverse().map((week, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-2 bg-[var(--color-surface-elevated)]/30 rounded-lg"
            >
              <span className="text-sm font-medium text-[var(--color-text-primary)] font-outfit">
                Week of {week.week}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                  {week.completions}/{week.possible}
                </span>
                <span className="text-sm font-semibold text-[var(--color-brand-400)] font-outfit">
                  {week.rate.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompletionRateChart;