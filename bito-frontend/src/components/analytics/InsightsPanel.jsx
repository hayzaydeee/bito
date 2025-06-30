import React, { useMemo } from 'react';
import { 
  LightningBoltIcon, 
  InfoCircledIcon, 
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircledIcon,
  CalendarIcon,
  ClockIcon
} from '@radix-ui/react-icons';

const InsightsPanel = ({ habits, entries, analyticsData, timeRange }) => {
  const insights = useMemo(() => {
    if (!habits.length) return [];

    const days = parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const generatedInsights = [];

    // Analyze completion patterns
    const weekdayCompletions = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const timeOfDayCompletions = { morning: 0, afternoon: 0, evening: 0 };
    let totalWeekdayPossible = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    habits.forEach(habit => {
      const habitEntries = entries[habit._id] || {};
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();
        const entry = habitEntries[dateStr];
        
        totalWeekdayPossible[dayOfWeek]++;
        
        if (entry && entry.completed) {
          weekdayCompletions[dayOfWeek]++;
          
          // Analyze time of completion if available
          if (entry.completedAt) {
            const hour = new Date(entry.completedAt).getHours();
            if (hour < 12) timeOfDayCompletions.morning++;
            else if (hour < 18) timeOfDayCompletions.afternoon++;
            else timeOfDayCompletions.evening++;
          }
        }
      }
    });

    // Best day of week insight
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekdayRates = Object.entries(weekdayCompletions).map(([day, completions]) => ({
      day: parseInt(day),
      name: dayNames[parseInt(day)],
      rate: totalWeekdayPossible[day] > 0 ? (completions / totalWeekdayPossible[day]) * 100 : 0
    }));
    
    const bestDay = weekdayRates.reduce((best, current) => 
      current.rate > best.rate ? current : best
    );
    
    const worstDay = weekdayRates.reduce((worst, current) => 
      current.rate < worst.rate ? current : worst
    );

    if (bestDay.rate > 0) {
      generatedInsights.push({
        type: 'success',
        icon: CheckCircledIcon,
        title: `${bestDay.name}s are your strongest day`,
        description: `You complete ${bestDay.rate.toFixed(1)}% of your habits on ${bestDay.name}s. Great consistency!`,
        action: `Keep up the momentum on ${bestDay.name}s and try to apply the same energy to other days.`
      });
    }

    if (worstDay.rate < bestDay.rate - 20 && worstDay.rate > 0) {
      generatedInsights.push({
        type: 'warning',
        icon: ExclamationTriangleIcon,
        title: `${worstDay.name}s need attention`,
        description: `Your completion rate drops to ${worstDay.rate.toFixed(1)}% on ${worstDay.name}s.`,
        action: `Consider setting easier goals for ${worstDay.name}s or preparing habits in advance.`
      });
    }

    // Streak analysis
    const habitStreaks = habits.map(habit => {
      const habitEntries = entries[habit._id] || {};
      let currentStreak = 0;
      let checkDate = new Date(endDate);
      
      while (checkDate >= startDate) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const entry = habitEntries[dateStr];
        
        if (entry && entry.completed) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      return { ...habit, currentStreak };
    });

    const longestCurrentStreak = habitStreaks.reduce((max, habit) => 
      habit.currentStreak > max.currentStreak ? habit : max
    , { currentStreak: 0 });

    if (longestCurrentStreak.currentStreak >= 7) {
      generatedInsights.push({
        type: 'success',
        icon: ArrowUpIcon,
        title: `Amazing ${longestCurrentStreak.currentStreak}-day streak!`,
        description: `You're on fire with "${longestCurrentStreak.name}" - ${longestCurrentStreak.currentStreak} days straight!`,
        action: `This streak shows your commitment. Consider using this momentum to strengthen other habits.`
      });
    }

    // Completion rate trends
    if (analyticsData.averageCompletionRate >= 80) {
      generatedInsights.push({
        type: 'success',
        icon: CheckCircledIcon,
        title: 'Excellent consistency!',
        description: `You're maintaining an impressive ${analyticsData.averageCompletionRate}% completion rate.`,
        action: 'You might be ready to add a new challenging habit to your routine.'
      });
    } else if (analyticsData.averageCompletionRate < 50) {
      generatedInsights.push({
        type: 'warning',
        icon: ExclamationTriangleIcon,
        title: 'Room for improvement',
        description: `Your ${analyticsData.averageCompletionRate}% completion rate suggests habits might be too ambitious.`,
        action: 'Consider simplifying your habits or reducing their frequency to build momentum.'
      });
    }

    // Time of day preference
    const bestTimeOfDay = Object.entries(timeOfDayCompletions).reduce((best, [time, count]) => 
      count > best.count ? { time, count } : best
    , { time: 'morning', count: 0 });

    if (bestTimeOfDay.count > 0) {
      generatedInsights.push({
        type: 'info',
        icon: ClockIcon,
        title: `You're a ${bestTimeOfDay.time} person`,
        description: `Most of your habit completions happen in the ${bestTimeOfDay.time}.`,
        action: `Schedule your most important habits during ${bestTimeOfDay.time} hours for better success.`
      });
    }

    // Weekly pattern analysis
    const recentWeekCompletions = [];
    let weekStart = new Date(endDate);
    weekStart.setDate(weekStart.getDate() - 6); // Last 7 days

    for (let week = 0; week < Math.min(4, Math.floor(days / 7)); week++) {
      let weekCompletions = 0;
      let weekPossible = 0;
      
      for (let day = 0; day < 7; day++) {
        const checkDate = new Date(weekStart);
        checkDate.setDate(checkDate.getDate() + day);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        habits.forEach(habit => {
          const habitEntries = entries[habit._id] || {};
          const entry = habitEntries[dateStr];
          weekPossible++;
          if (entry && entry.completed) {
            weekCompletions++;
          }
        });
      }
      
      recentWeekCompletions.push({
        week,
        rate: weekPossible > 0 ? (weekCompletions / weekPossible) * 100 : 0
      });
      
      weekStart.setDate(weekStart.getDate() - 7);
    }

    // Trend analysis
    if (recentWeekCompletions.length >= 2) {
      const trend = recentWeekCompletions[0].rate - recentWeekCompletions[1].rate;
      
      if (trend > 10) {
        generatedInsights.push({
          type: 'success',
          icon: ArrowUpIcon,
          title: 'Strong upward trend!',
          description: `Your completion rate improved by ${trend.toFixed(1)}% this week.`,
          action: 'Whatever changes you made are working - keep it up!'
        });
      } else if (trend < -10) {
        generatedInsights.push({
          type: 'warning',
          icon: ArrowDownIcon,
          title: 'Completion rate declining',
          description: `Your completion rate dropped by ${Math.abs(trend).toFixed(1)}% this week.`,
          action: 'Consider what changed recently and adjust your approach accordingly.'
        });
      }
    }

    return generatedInsights.slice(0, 4); // Limit to 4 insights
  }, [habits, entries, analyticsData, timeRange]);

  const getInsightStyles = (type) => {
    const styleMap = {
      success: {
        bg: 'from-[var(--color-success)]/10 to-[var(--color-success)]/5',
        border: 'border-[var(--color-success)]/20',
        icon: 'text-[var(--color-success)]'
      },
      warning: {
        bg: 'from-[var(--color-warning)]/10 to-[var(--color-warning)]/5',
        border: 'border-[var(--color-warning)]/20',
        icon: 'text-[var(--color-warning)]'
      },
      info: {
        bg: 'from-[var(--color-info)]/10 to-[var(--color-info)]/5',
        border: 'border-[var(--color-info)]/20',
        icon: 'text-[var(--color-info)]'
      }
    };
    return styleMap[type] || styleMap.info;
  };

  if (!habits.length) {
    return (
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-semibold font-dmSerif text-[var(--color-text-primary)] mb-4">
          Smart Insights
        </h3>
        <div className="text-center py-12">
          <LightningBoltIcon className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)] font-outfit">
            AI-powered insights will appear here as you build your habit data
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
          Smart Insights
        </h3>
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] font-outfit">
          <LightningBoltIcon className="w-4 h-4 text-[var(--color-brand-400)]" />
          AI-Powered
        </div>
      </div>

      {/* Insights Grid */}
      {insights.length === 0 ? (
        <div className="text-center py-8">
          <InfoCircledIcon className="w-8 h-8 text-[var(--color-text-tertiary)] mx-auto mb-3" />
          <p className="text-[var(--color-text-secondary)] font-outfit">
            Keep tracking your habits to unlock personalized insights!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            const styles = getInsightStyles(insight.type);
            
            return (
              <div 
                key={index}
                className={`relative overflow-hidden rounded-xl border ${styles.border} p-4 bg-gradient-to-br ${styles.bg}`}
              >
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="mb-3">
                    <Icon className={`w-5 h-5 ${styles.icon}`} />
                  </div>

                  {/* Title */}
                  <h4 className="font-semibold text-[var(--color-text-primary)] font-outfit mb-2 text-sm">
                    {insight.title}
                  </h4>

                  {/* Description */}
                  <p className="text-xs text-[var(--color-text-secondary)] font-outfit mb-3 line-clamp-2">
                    {insight.description}
                  </p>

                  {/* Action */}
                  <p className="text-xs text-[var(--color-text-primary)] font-outfit font-medium 0 rounded-lg p-2">
                    💡 {insight.action}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-[var(--color-border-primary)]/20">
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-text-tertiary)] font-outfit">
          <CalendarIcon className="w-4 h-4" />
          <span>
            Insights based on {timeRange} of habit data • Updates daily
          </span>
        </div>
      </div>
    </div>
  );
};

export default InsightsPanel;