import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PersonIcon, BarChartIcon } from '@radix-ui/react-icons';

// Predefined colors for member lines
const MEMBER_COLORS = [
  '#4f46e5', // indigo
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
];

const GroupStreaksChart = ({ 
  members = [], 
  completionData = [], 
  timeRange = 'week',
  className = '' 
}) => {
  console.log('GroupStreaksChart render:', { membersCount: members.length, dataCount: completionData.length });

  // Generate chart data for the week
  const chartData = useMemo(() => {
    if (!members.length) return [];

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday

    const weekData = [];
    
    for (let day = 0; day < 7; day++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + day);
      
      const dayData = {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toISOString().split('T')[0],
      };

      // Add completion counts for each member
      members.forEach((member, index) => {
        const memberKey = member.userId?.name || member.name || `Member ${index + 1}`;
        // For now, generate sample data - in real app this would come from API
        dayData[memberKey] = Math.floor(Math.random() * 8); // 0-7 completions per day
      });

      weekData.push(dayData);
    }

    return weekData;
  }, [members]);

  // Get top performers
  const topPerformers = useMemo(() => {
    if (!chartData.length || !members.length) return [];

    const memberTotals = members.map((member, index) => {
      const memberKey = member.userId?.name || member.name || `Member ${index + 1}`;
      const total = chartData.reduce((sum, day) => sum + (day[memberKey] || 0), 0);
      return {
        name: memberKey,
        total,
        avatar: member.userId?.avatar || member.avatar,
        color: MEMBER_COLORS[index % MEMBER_COLORS.length]
      };
    });

    return memberTotals.sort((a, b) => b.total - a.total).slice(0, 3);
  }, [chartData, members]);

  if (!members.length) {
    return (
      <div className={`bg-[var(--color-surface-elevated)] rounded-xl p-6 text-center ${className}`}>
        <PersonIcon className="w-8 h-8 text-[var(--color-text-tertiary)] mx-auto mb-2" />
        <p className="text-sm text-[var(--color-text-tertiary)] font-outfit">
          No team members to display
        </p>
      </div>
    );
  }

  return (
    <div className={`h-full glass-card-minimal p-6 rounded-2xl flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center shadow-lg">
            <BarChartIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold font-dmSerif text-[var(--color-text-primary)]">
              Team Streaks
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
              Daily completions this week
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] font-outfit">
          <div className="w-2 h-2 rounded-full bg-[var(--color-success)]"></div>
          This Week
        </div>
      </div>

      {/* Chart */}
      <div className="mb-4">
        <div className="h-48 bg-[var(--color-surface-elevated)]/30 rounded-xl border border-[var(--color-border-primary)]/20">
          <ResponsiveContainer 
            width="100%" 
            height="100%"
            style={{ backgroundColor: "transparent" }}
          >
            <LineChart 
              data={chartData} 
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
                dataKey="day" 
                stroke="var(--color-text-secondary)"
                fontSize={11}
                fontFamily="var(--font-outfit)"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                height={30}
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
                formatter={(value, name) => [`${value} completions`, name]}
              />
              {members.slice(0, 3).map((member, index) => {
                const memberKey = member.userId?.name || member.name || `Member ${index + 1}`;
                const color = MEMBER_COLORS[index % MEMBER_COLORS.length];
                return (
                  <Line
                    key={memberKey}
                    type="monotone"
                    dataKey={memberKey}
                    stroke={color}
                    strokeWidth={3}
                    dot={{
                      fill: color,
                      strokeWidth: 0,
                      r: 4,
                    }}
                    activeDot={{
                      r: 7,
                      fill: color,
                      stroke: "var(--color-surface-primary)",
                      strokeWidth: 2,
                    }}
                    connectNulls={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Chart Legend */}
        {members.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3 justify-center">
            {members.slice(0, 3).map((member, index) => {
              const memberKey = member.userId?.name || member.name || `Member ${index + 1}`;
              const color = MEMBER_COLORS[index % MEMBER_COLORS.length];
              return (
                <div key={memberKey} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-outfit text-[var(--color-text-secondary)]">
                    {memberKey}
                  </span>
                </div>
              );
            })}
            {members.length > 3 && (
              <span className="text-xs font-outfit text-[var(--color-text-tertiary)] italic">
                +{members.length - 3} more members (showing top 3)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Top Performers - Compact */}
      {topPerformers.length > 0 && (
        <div className="border-t border-[var(--color-border-primary)]/20 pt-4">
          <h4 className="text-xs font-medium text-[var(--color-text-tertiary)] font-outfit uppercase tracking-wide mb-2">
            Week Leaders
          </h4>
          <div className="space-y-1">
            {topPerformers.slice(0, 3).map((performer, index) => (
              <div key={performer.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-[var(--color-brand-400)] to-[var(--color-brand-600)] text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-xs text-[var(--color-text-primary)] font-outfit font-medium">
                    {performer.name}
                  </span>
                </div>
                <span className="text-xs font-semibold text-[var(--color-text-secondary)] font-outfit">
                  {performer.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupStreaksChart;
