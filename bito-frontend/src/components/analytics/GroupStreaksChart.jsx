import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PersonIcon, BarChartIcon } from '@radix-ui/react-icons';

// Utility function to get a consistent member key for both data initialization and processing
const getMemberKey = (member, index) => {
  if (!member) return `Unknown Member ${index}`;
  
  // Try to get a meaningful name from the member object
  // Check all possible locations where the name might be stored
  const name = 
    member.name || 
    (member.userId && typeof member.userId === 'object' && member.userId.name) ||
    (member.user && member.user.name) ||
    (member.user && typeof member.user === 'object' && member.user.name);
  
  if (name) return name;
  
  // If no name found, use ID as fallback
  const id = 
    (member.userId && typeof member.userId === 'string' && member.userId) ||
    (member.userId && typeof member.userId === 'object' && member.userId._id) ||
    member._id ||
    member.id;
    
  if (id) return `User ${id.toString().substring(0, 6)}`;
  
  // Last resort: use index
  return `Member ${index + 1}`;
};

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
  console.log('GroupStreaksChart render:', { 
    membersCount: members.length, 
    dataCount: completionData.length,
    completionSample: completionData.slice(0, 2),
    membersSample: members.slice(0, 2).map(m => ({
      id: m.userId?._id || m.userId || m.id,
      name: m.name,
      userIdType: m.userId ? typeof m.userId : 'undefined',
      key: getMemberKey(m, members.indexOf(m))
    }))
  });

  // Generate chart data for the week using real completion data
  const chartData = useMemo(() => {
    console.log('GroupStreaksChart - Starting chart data generation with:', {
      membersCount: members.length,
      completionDataCount: completionData.length
    });

    // For debugging: Dump first few entries of each array
    if (members.length > 0) {
      console.log('GroupStreaksChart - Members sample:', 
        members.slice(0, 3).map(m => ({
          id: m.id || m._id,
          userId: m.userId ? (typeof m.userId === 'object' ? m.userId._id : m.userId) : 'none',
          name: m.name || (m.userId && m.userId.name) || 'unnamed'
        }))
      );
    }
    
    if (completionData.length > 0) {
      console.log('GroupStreaksChart - Completion data sample:', 
        completionData.slice(0, 3).map(entry => ({
          userId: entry.userId ? (typeof entry.userId === 'object' ? entry.userId._id : entry.userId) : 'none',
          date: entry.date,
          habitId: entry.habitId
        }))
      );
    }

    if (!members.length) return [];

    // Create member ID map for quick lookup (handling various ID formats)
    const memberMap = new Map();
    members.forEach((member, index) => {
      // Handle all possible ID formats that could come from the backend
      // MongoDB IDs can be represented in multiple ways
      
      // 1. Handle userId object with _id
      if (member.userId && typeof member.userId === 'object' && member.userId._id) {
        memberMap.set(member.userId._id.toString(), { 
          member, index, key: getMemberKey(member, index)
        });
      }
      
      // 2. Handle userId as string
      if (member.userId && typeof member.userId === 'string') {
        memberMap.set(member.userId, { 
          member, index, key: getMemberKey(member, index)
        });
      }
      
      // 3. Handle direct _id
      if (member._id) {
        memberMap.set(member._id.toString(), { 
          member, index, key: getMemberKey(member, index)
        });
      }
      
      // 4. Handle direct id
      if (member.id) {
        memberMap.set(member.id.toString(), { 
          member, index, key: getMemberKey(member, index)
        });
      }
      
      // 5. Handle user object with _id (just in case)
      if (member.user && typeof member.user === 'object' && member.user._id) {
        memberMap.set(member.user._id.toString(), { 
          member, index, key: getMemberKey(member, index)
        });
      }
      
      // 6. As a last resort, use the member's index as a key
      memberMap.set(`member-index-${index}`, { 
        member, index, key: getMemberKey(member, index)
      });
    });
    
    console.log('GroupStreaksChart - Created member map with keys:', 
      Array.from(memberMap.keys()).slice(0, 5));

    console.log('GroupStreaksChart - Created member map with keys:', 
      Array.from(memberMap.keys()).slice(0, 5));

    // Set up weekly data structure
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
    
    const weekData = [];
    
    // Create data structure for each day of the week
    for (let day = 0; day < 7; day++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + day);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dateStr,
      };

      // Initialize all members with 0 completions
      members.forEach((member, index) => {
        const memberKey = getMemberKey(member, index);
        dayData[memberKey] = 0;
      });

      weekData.push(dayData);
    }
    
    // Create a date map for quick lookup of day data
    const dateMap = new Map();
    weekData.forEach(day => {
      dateMap.set(day.date, day);
    });
    
    // Process completion data - using a more direct approach
    let matchCount = 0;
    
    if (completionData && completionData.length > 0) {
      // First, let's examine what kinds of user IDs we're dealing with in the completion data
      const sampleUserIds = completionData.slice(0, 5).map(entry => ({
        userId: entry.userId,
        type: typeof entry.userId,
        hasIdProperty: typeof entry.userId === 'object' && entry.userId && '_id' in entry.userId,
        idValue: typeof entry.userId === 'object' && entry.userId?._id ? entry.userId._id.toString() : 
                (entry.userId ? entry.userId.toString() : 'none')
      }));
      
      console.log('Completion data userIds sample:', sampleUserIds);
      
      // Process each completion entry
      completionData.forEach(entry => {
        // Skip if no date or not completed
        if (!entry.date || entry.completed === false) return;
        
        // Format date consistently
        const dateKey = entry.date.split('T')[0];
        const dayData = dateMap.get(dateKey);
        
        // Skip if not in current week
        if (!dayData) {
          console.log(`Date not in current week: ${dateKey}`);
          return;
        }
        
        // Try multiple userId formats for matching
        let matched = false;
        
        // Extract all possible userId formats
        const possibleIds = [];
        
        // 1. Direct userId as string
        if (entry.userId && typeof entry.userId === 'string') {
          possibleIds.push(entry.userId);
        }
        
        // 2. userId._id from object
        if (entry.userId && typeof entry.userId === 'object' && entry.userId._id) {
          possibleIds.push(entry.userId._id.toString());
        }
        
        // 3. userId as object without _id property
        if (entry.userId && typeof entry.userId === 'object') {
          possibleIds.push(entry.userId.toString());
        }
        
        // Try all possible IDs for matching
        for (const idStr of possibleIds) {
          const memberData = memberMap.get(idStr);
          if (memberData) {
            const { key } = memberData;
            dayData[key] += 1;
            matchCount++;
            matched = true;
            break; // Stop after first match
          }
        }
        
        // If still no match found, try a more exhaustive search
        if (!matched && members.length <= 10) { // Only for reasonable member counts
          // Try direct comparison with all members
          for (let i = 0; i < members.length; i++) {
            const member = members[i];
            
            // Compare all possible ID combinations
            if ((member.userId && entry.userId && member.userId.toString() === entry.userId.toString()) ||
                (member.userId && typeof entry.userId === 'object' && entry.userId._id && 
                 member.userId.toString() === entry.userId._id.toString()) ||
                (member._id && entry.userId && member._id.toString() === entry.userId.toString()) ||
                (member.id && entry.userId && member.id.toString() === entry.userId.toString())) {
              
              const key = getMemberKey(member, i);
              dayData[key] += 1;
              matchCount++;
              matched = true;
              break;
            }
          }
        }
        
        if (!matched && matchCount < 3) {
          console.log('No match found for entry:', entry);
        }
      });
    }
    
    console.log(`GroupStreaksChart - Final processing: matched ${matchCount}/${completionData.length} completion entries`);
    console.log('GroupStreaksChart - Final chart data structure:', weekData);
    
    

    return weekData;
  }, [members, completionData]);

  // Get top performers
  const topPerformers = useMemo(() => {
    if (!chartData.length || !members.length) return [];

    const memberTotals = members.map((member, index) => {
      const memberKey = getMemberKey(member, index);
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
                const memberKey = getMemberKey(member, index);
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
              const memberKey = getMemberKey(member, index);
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
