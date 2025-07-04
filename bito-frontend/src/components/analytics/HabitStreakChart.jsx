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

const HabitStreakChart = ({ 
  habits = [], 
  entries = {}, 
  timeRange = '30d',
  dateRange,
  widgetMode = false,
  showLegend = true,
  maxHabitsDisplayed = 3,
  chartHeight = 320,
  showTopStreaks = true
}) => {
  // Calculate streak data for the time period
  const { chartData, topHabits } = useMemo(() => {
    if (!habits.length) {
      return { chartData: [], topHabits: [] };
    }

    // Determine date range
    let startDate, endDate;
    if (dateRange && dateRange.start && dateRange.end) {
      startDate = new Date(dateRange.start);
      endDate = new Date(dateRange.end);
    } else {
      // Default to timeRange
      endDate = new Date();
      startDate = new Date();
      const days = parseInt(timeRange) || 30;
      startDate.setDate(endDate.getDate() - days);
    }

    // Calculate total completions for each habit in the period
    const habitCompletions = habits.map(habit => {
      const habitEntries = entries[habit._id] || {};
      let totalCompletions = 0;

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        // Use local timezone date string to avoid UTC conversion issues
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const entry = habitEntries[dateStr];
        if (entry && entry.completed) {
          totalCompletions++;
        }
      }

      return {
        habit,
        totalCompletions,
        name: habit.name,
        color: habit.color || 'var(--color-brand-400)'
      };
    });

    // Sort by total completions and take top 3 (only habits with completions)
    const topHabitsData = habitCompletions
      .filter(({ totalCompletions }) => totalCompletions > 0)
      .sort((a, b) => b.totalCompletions - a.totalCompletions)
      .slice(0, maxHabitsDisplayed);

    // Generate chart data for each day
    const data = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Use local timezone date string to avoid UTC conversion issues
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Debug the generated date string
      console.log('Generated dateStr:', dateStr, 'from date:', d);
      
      const dayData = {
        date: dateStr,
        formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };

      // Calculate running streak for each top habit
      topHabitsData.forEach(({ habit }) => {
        const habitEntries = entries[habit._id] || {};
        let currentStreak = 0;
        
        // Calculate streak up to this date
        for (let streakDate = new Date(d); streakDate >= startDate; streakDate.setDate(streakDate.getDate() - 1)) {
          // Use local timezone date string to avoid UTC conversion issues
          const year = streakDate.getFullYear();
          const month = String(streakDate.getMonth() + 1).padStart(2, '0');
          const day = String(streakDate.getDate()).padStart(2, '0');
          const streakDateStr = `${year}-${month}-${day}`;
          const entry = habitEntries[streakDateStr];
          
          if (entry && entry.completed) {
            currentStreak++;
          } else {
            break;
          }
        }
        
        dayData[habit._id] = currentStreak;
      });

      data.push(dayData);
    }

    return { 
      chartData: data, 
      topHabits: topHabitsData 
    };
  }, [habits, entries, timeRange, dateRange, maxHabitsDisplayed]);

  // Color palette for different habits (using brand colors)
  const colors = [
    'var(--color-brand-400)', // Primary brand color
    'var(--color-success)', // Green
    'var(--color-warning)', // Yellow/Orange
    'var(--color-error)', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316'  // Orange
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    // Debug the label value
    console.log('Tooltip label:', label, typeof label);
    console.log('Payload:', payload);

    let dateDisplay = label; // fallback to the label itself
    
    // The label is actually the formattedDate (like "Jul 4"), not the full date
    // We need to get the actual date from the payload data
    if (payload[0] && payload[0].payload && payload[0].payload.date) {
      const fullDateStr = payload[0].payload.date;
      console.log('Full date from payload:', fullDateStr);
      
      try {
        if (fullDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = fullDateStr.split('-').map(Number);
          const date = new Date(year, month - 1, day); // month is 0-indexed
          
          if (!isNaN(date.getTime())) {
            dateDisplay = date.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            });
          }
        }
      } catch (error) {
        console.error('Date parsing error:', error);
      }
    }

    return (
      <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-secondary)] rounded-lg p-3 shadow-lg"
           style={{
             boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
             fontFamily: "var(--font-outfit)",
             fontSize: "12px"
           }}>
        <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2" 
           style={{ fontSize: "11px", marginBottom: "4px" }}>
          {dateDisplay}
        </p>
        {payload.map((entry, index) => {
          const habit = topHabits.find(h => h.habit._id === entry.dataKey);
          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[var(--color-text-secondary)]">
                {habit?.habit.name}: 
              </span>
              <span className="font-medium text-[var(--color-text-primary)]">
                {entry.value} day{entry.value !== 1 ? 's' : ''}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (!habits.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-[var(--color-text-secondary)]">
          <div className="text-lg font-semibold mb-2">No Habits Yet</div>
          <div className="text-sm">Add some habits to see your streak progress</div>
        </div>
      </div>
    );
  }

  if (!topHabits.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-[var(--color-text-secondary)]">
          <div className="text-lg font-semibold mb-2">No Data Available</div>
          <div className="text-sm">Start completing habits to see your streaks</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {!widgetMode && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            Habit Streaks
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Tracking streaks for your top {maxHabitsDisplayed} most completed habits
          </p>
        </div>
      )}
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="var(--color-border-primary)" 
              opacity={0.3}
              vertical={false}
            />
            <XAxis
              dataKey="formattedDate"
              stroke="var(--color-text-secondary)"
              fontSize={11}
              fontFamily="var(--font-outfit)"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="var(--color-text-secondary)"
              fontSize={11}
              fontFamily="var(--font-outfit)"
              axisLine={false}
              tickLine={false}
              width={25}
              tickFormatter={(value) => Math.round(value).toString()}

            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend 
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-outfit)'
                }}
              />
            )}
            {topHabits.map((habitData, index) => (
              <Line
                key={habitData.habit._id}
                type="monotone"
                dataKey={habitData.habit._id}
                stroke={habitData.color || colors[index % colors.length]}
                strokeWidth={3}
                dot={{ 
                  fill: habitData.color || colors[index % colors.length],
                  r: 4 
                }}
                activeDot={{ 
                  r: 6,
                  fill: habitData.color || colors[index % colors.length],
                  stroke: "var(--color-surface-primary)",
                  strokeWidth: 2
                }}
                name={habitData.habit.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {showTopStreaks && !widgetMode && (
        <div className="mt-4 p-4 bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border-primary)]">
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            Top Habits by Completions
          </h4>
          <div className="space-y-2">
            {topHabits.map((habitData, index) => (
              <div key={habitData.habit._id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: habitData.color || colors[index % colors.length] }}
                  />
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {habitData.habit.name}
                  </span>
                </div>
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {habitData.totalCompletions} completion{habitData.totalCompletions !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitStreakChart;
