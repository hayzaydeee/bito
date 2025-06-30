import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { DoubleArrowUpIcon, ArrowUpIcon } from '@radix-ui/react-icons';

const HabitStreakChart = ({ habits, entries, timeRange, widgetMode = false, chartHeight }) => {
  const chartData = useMemo(() => {
    if (!habits.length) return { data: [], maxStreak: 0, habitColors: {} };

    const days = parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const data = [];
    const habitColors = {};
    
    // Initialize habit colors
    habits.forEach(habit => {
      habitColors[habit._id] = habit.color || '#6366f1';
    });

    // Generate data points for each day
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayData = {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: dateStr
      };

      // Calculate streak for each habit on this day
      habits.forEach(habit => {
        const habitEntries = entries[habit._id] || {};
        
        // Calculate streak up to this date
        let currentStreak = 0;
        let checkDate = new Date(d);
        
        while (checkDate >= startDate) {
          const checkDateStr = checkDate.toISOString().split('T')[0];
          const checkEntry = habitEntries[checkDateStr];
          
          if (checkEntry && checkEntry.completed) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        
        dayData[habit._id] = currentStreak;
      });
      
      data.push(dayData);
    }

    // Find max streak for Y-axis scaling
    const maxStreak = Math.max(
      ...data.flatMap(day => habits.map(habit => day[habit._id] || 0)),
      1
    );

    return { data, maxStreak, habitColors };
  }, [habits, entries, timeRange]);

  const topStreaks = useMemo(() => {
    if (!habits.length || !chartData.data.length) return [];
    
    return habits
      .map(habit => {
        const habitStreaks = chartData.data.map(day => day[habit._id] || 0);
        const maxStreak = Math.max(...habitStreaks, 0);
        const currentStreak = habitStreaks[habitStreaks.length - 1] || 0;
        
        return {
          name: habit.name,
          maxStreak,
          currentStreak,
          color: habit.color || '#6366f1'
        };
      })
      .sort((a, b) => b.maxStreak - a.maxStreak)
      .slice(0, 5);
  }, [habits, chartData]);

  if (!habits.length) {
    const content = (
      <div className="text-center py-12">
        <DoubleArrowUpIcon className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
        <p className="text-[var(--color-text-secondary)] font-outfit">
          Add some habits to see your streak patterns
        </p>
      </div>
    );

    if (widgetMode) {
      return content;
    }

    return (
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-semibold font-dmSerif text-[var(--color-text-primary)] mb-4">
          Habit Streaks
        </h3>
        {content}
      </div>
    );
  }

  const content = (
    <>
      {/* Header - only show in non-widget mode */}
      {!widgetMode && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold font-dmSerif text-[var(--color-text-primary)]">
            Habit Streaks
          </h3>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] font-outfit">
            <ArrowUpIcon className="w-4 h-4" />
            Last {timeRange}
          </div>
        </div>
      )}

      {/* Chart Area */}
      <div className={`${!widgetMode ? 'mb-6' : 'mb-4'}`}>
        <div 
          className={`${widgetMode ? '' : 'h-80'} bg-[var(--color-surface-elevated)]/30 rounded-xl border border-[var(--color-border-primary)]/20`}
          style={widgetMode ? { height: `${chartHeight || 280}px` } : {}}
        >
          <ResponsiveContainer 
            width="100%" 
            height="100%"
            style={{ backgroundColor: "transparent" }}
          >
            <LineChart
              data={chartData.data}
              margin={{ top: 25, right: 20, left: 20, bottom: 25 }}
              style={{ backgroundColor: "transparent" }}
            >
              <CartesianGrid
                strokeDasharray="1 1"
                stroke="var(--color-border-primary)"
                strokeOpacity={0.3}
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="var(--color-text-secondary)"
                fontSize={widgetMode ? 11 : 12}
                fontFamily="var(--font-outfit)"
                axisLine={false}
                tickLine={false}
                interval={Math.floor(chartData.data.length / 6)}
                tick={{ fontSize: widgetMode ? 11 : 12 }}
                height={30}
              />
              <YAxis
                stroke="var(--color-text-secondary)"
                fontSize={widgetMode ? 11 : 12}
                fontFamily="var(--font-outfit)"
                domain={[0, chartData.maxStreak]}
                axisLine={false}
                tickLine={false}
                width={25}
                tickFormatter={(value) => Math.round(value).toString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-border-secondary)",
                  borderRadius: "6px",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-outfit)",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  padding: "8px 12px",
                }}
                labelStyle={{
                  color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-outfit)",
                  fontSize: "11px",
                  marginBottom: "4px",
                }}
                formatter={(value, name) => {
                  const habit = habits.find(h => h._id === name);
                  return [`${value} days`, habit?.name || 'Habit'];
                }}
              />
              
              {/* Render lines for top 3 habits only */}
              {habits.slice(0, 3).map((habit, index) => (
                <Line
                  key={habit._id}
                  type="monotone"
                  dataKey={habit._id}
                  stroke={habit.color || '#6366f1'}
                  strokeWidth={widgetMode ? 3 : 2.5}
                  dot={{
                    fill: habit.color || '#6366f1',
                    strokeWidth: 0,
                    r: widgetMode ? 4 : 3,
                  }}
                  activeDot={{
                    r: widgetMode ? 7 : 6,
                    fill: habit.color || '#6366f1',
                    stroke: "var(--color-surface-primary)",
                    strokeWidth: 2,
                  }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Chart Legend */}
        {habits.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3 justify-center">
            {habits.slice(0, 3).map((habit) => (
              <div key={habit._id} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: habit.color || '#6366f1' }}
                ></div>
                <span className={`${widgetMode ? 'text-xs' : 'text-xs'} font-outfit text-[var(--color-text-secondary)]`}>
                  {habit.name}
                </span>
              </div>
            ))}
            {habits.length > 3 && (
              <span className="text-xs font-outfit text-[var(--color-text-tertiary)] italic">
                +{habits.length - 3} more habits (showing top 3)
              </span>
            )}
          </div>
        )}
      </div>

    </>
  );

  if (widgetMode) {
    return content;
  }

  return (
    <div className="glass-card p-6 rounded-2xl">
      {content}
    </div>
  );
};

export default HabitStreakChart;