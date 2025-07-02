import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const MemberProgressChart = ({ 
  memberHabits = [], 
  memberEntries = {}, 
  timeRange = '30d',
  dateRange,
  chartType = 'line', // 'line' or 'bar'
  chartHeight = 300,
  showGrid = true,
  memberId
}) => {
  // Calculate progress data for the time period
  const { chartData, maxValue } = useMemo(() => {
    if (!memberHabits.length) {
      return { chartData: [], maxValue: 0 };
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

    // Build data points for each day
    const dataPoints = [];
    let maxVal = 0;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const formattedDate = d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });

      const dayData = {
        date: formattedDate,
        fullDate: dateStr,
        totalCompleted: 0,
        totalHabits: memberHabits.length,
        completionRate: 0
      };

      // Calculate completions for this day
      memberHabits.forEach(habit => {
        const habitEntries = memberEntries[habit._id] || {};
        const entry = habitEntries[dateStr];
        
        if (entry && entry.completed) {
          dayData.totalCompleted += 1;
        }
      });

      dayData.completionRate = memberHabits.length > 0 
        ? Math.round((dayData.totalCompleted / memberHabits.length) * 100)
        : 0;

      maxVal = Math.max(maxVal, dayData.totalCompleted);
      dataPoints.push(dayData);
    }

    return { chartData: dataPoints, maxValue: maxVal };
  }, [memberHabits, memberEntries, timeRange, dateRange]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          <p className="text-sm text-gray-600">
            Completed: {data.totalCompleted} / {data.totalHabits} habits
          </p>
          <p className="text-sm text-gray-600">
            Rate: {data.completionRate}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No Progress Data</p>
          <p className="text-sm">No habit data available for this time period</p>
        </div>
      </div>
    );
  }

  // Color scheme for the charts
  const colors = {
    primary: '#4f46e5', // indigo
    secondary: '#10b981', // emerald
    tertiary: '#f59e0b', // amber
    quaternary: '#ef4444' // red
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={chartHeight}>
        {chartType === 'line' ? (
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
            )}
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
              domain={[0, Math.max(maxValue + 1, 5)]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="totalCompleted"
              stroke={colors.primary}
              strokeWidth={3}
              dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors.primary, strokeWidth: 2 }}
            />
          </LineChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
            )}
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
              domain={[0, Math.max(maxValue + 1, 5)]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="totalCompleted" 
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.completionRate >= 80 ? colors.secondary : 
                        entry.completionRate >= 60 ? colors.tertiary : 
                        entry.completionRate >= 40 ? colors.primary : colors.quaternary} 
                />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Progress summary */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>80%+ completion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>60-79% completion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span>40-59% completion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>&lt;40% completion</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberProgressChart;
