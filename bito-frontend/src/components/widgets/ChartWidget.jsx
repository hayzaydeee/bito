import { useMemo, memo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { useChartData } from "../../globalHooks/useChartData";
import { EmptyStateWithAddHabit } from "../habitGrid/EmptyStateWithAddHabit.jsx";
import "./widgets.css";

// Helper function to generate chart data from props (for member dashboards)
const generateChartDataFromProps = (habits, entries, chartType, dateRange) => {
  if (!habits || habits.length === 0) {
    return [];
  }

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  
  // Default to current week if no date range provided
  const startDate = dateRange?.start || weekStart;
  const endDate = dateRange?.end || new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

  switch (chartType) {
    case 'completion':
      return generateCompletionChartFromProps(habits, entries, startDate, endDate);
    default:
      return generateCompletionChartFromProps(habits, entries, startDate, endDate);
  }
};

// Helper function to generate completion chart data from props
const generateCompletionChartFromProps = (habits, entries, startDate, endDate) => {
  const data = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    
    let totalHabits = 0;
    let completedHabits = 0;
    
    habits.forEach(habit => {
      totalHabits++;
      
      // Check if there's an entry for this habit on this date
      const habitEntries = entries[habit._id];
      let hasCompletedEntry = false;
      
      if (habitEntries) {
        if (Array.isArray(habitEntries)) {
          // Handle array format (legacy or direct API response)
          hasCompletedEntry = habitEntries.some(entry => {
            const entryDate = new Date(entry.date).toISOString().split('T')[0];
            return entryDate === dateStr && entry.completed;
          });
        } else if (typeof habitEntries === 'object') {
          // Handle object format (HabitContext format with date keys)
          const dayEntry = habitEntries[dateStr];
          hasCompletedEntry = dayEntry && dayEntry.completed;
        }
      }
      
      if (hasCompletedEntry) {
        completedHabits++;
      }
    });
    
    const completionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
    
    data.push({
      date: dateStr,
      day: current.toLocaleDateString('en-US', { weekday: 'short' }),
      completion: completionRate,
      completed: completedHabits,
      total: totalHabits,
      name: current.toLocaleDateString('en-US', { weekday: 'short' }),
      value: completedHabits
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return data;
};

export const ChartWidget = ({
  title,
  type = "bar",
  chartType = "completion",
  data = [],
  color = "#3B82F6",
  breakpoint = "lg",
  availableColumns = 8,
  availableRows = 4,
  size = { width: 320, height: 200 },
  widgetConfig = {},
  filterComponent = null,
  dateRange = null,
  onAddHabit = null,
  habits = null, // Add habits prop
  entries = null, // Add entries prop
}) => {
  // Get real habit data based on chart type - but only if habits/entries props aren't provided
  const habitChartData = useChartData(chartType, dateRange);

  // Use passed props if available, otherwise use hook data
  const finalData = useMemo(() => {
    // If habits and entries are provided as props, use them directly
    if (habits !== null && entries !== null) {
      // Generate chart data from the provided habits and entries
      const generatedData = generateChartDataFromProps(habits, entries, chartType, dateRange);
      return generatedData;
    }
    
    // Otherwise, use the hook data (for regular dashboard usage)
    if (habitChartData && habitChartData.length > 0) {
      return habitChartData;
    }

    if (data && data.length > 0) {
      return data;
    }

    // Fallback default data
    const fallbackData = [
      { name: "Mon", value: 0 },
      { name: "Tue", value: 0 },
      { name: "Wed", value: 0 },
      { name: "Thu", value: 0 },
      { name: "Fri", value: 0 },
      { name: "Sat", value: 0 },
      { name: "Sun", value: 0 },
    ];
    return fallbackData;
  }, [habitChartData, data, habits, entries, chartType, dateRange]);
  const pieData = [
    { name: "Completed", value: 27, color: "var(--color-success)" },
    { name: "Missed", value: 8, color: "var(--color-error)" },
  ];

  // Determine Y-axis domain based on data type
  const yAxisDomain = useMemo(() => {
    if (!finalData || finalData.length === 0) return [0, 10];

    const maxValue = Math.max(...finalData.map((item) => item.value || 0));

    // For habit completion data, use the actual count range
    if (chartType === "completion") {
      // Add a little padding above the max value, but ensure minimum scale of 10
      return [0, Math.max(10, Math.ceil(maxValue * 1.2))];
    }

    // For other data types, add some padding
    return [0, Math.ceil(maxValue * 1.1)];
  }, [finalData, chartType]);

  const commonProps = {
    width: size.width,
    height: size.height,
    data: finalData,
    margin: { top: 30, right: 15, left: 5, bottom: 5 },
  };

  const renderChart = () => {
    switch (type) {
      case "line": // Custom label component for showing values on points
        const CustomLabel = ({ x, y, value }) => {
          if (value === undefined || value === null) return null;
          return (
            <text
              x={x}
              y={y - 8}
              fill="var(--color-text-primary)"
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fontFamily="var(--font-outfit)"
            >
              {value}
            </text>
          );
        };
        return (
          <ResponsiveContainer 
            width="100%" 
            height="100%"
            style={{ backgroundColor: "transparent" }}
          >
            <LineChart
              {...commonProps}
              style={{ backgroundColor: "transparent" }}
            >
              {" "}
              <CartesianGrid
                strokeDasharray="1 1"
                stroke="var(--color-border-primary)"
                strokeOpacity={0.3}
                horizontal={true}
                vertical={false}
              />{" "}
              <XAxis
                dataKey="name"
                stroke="var(--color-text-secondary)"
                fontSize={10}
                fontFamily="var(--font-outfit)"
                axisLine={false}
                tickLine={false}
                interval={finalData.length > 20 ? Math.floor(finalData.length / 10) : 0}
                tick={{ fontSize: 10 }}
                height={30}
              />
              <YAxis
                stroke="var(--color-text-secondary)"
                fontSize={10}
                fontFamily="var(--font-outfit)"
                domain={yAxisDomain}
                axisLine={false}
                tickLine={false}
                width={25}
                tickFormatter={(value) =>
                  chartType === "completion" ? Math.round(value).toString() : value
                }
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
                formatter={(value, name) => [
                  chartType === "completion" ? `${value} habits` : value,
                  name === "value" ? "Completed" : name,
                ]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-brand-400)"
                strokeWidth={2.5}
                dot={{
                  fill: "var(--color-brand-400)",
                  strokeWidth: 0,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  fill: "var(--color-brand-400)",
                  stroke: "var(--color-surface-primary)",
                  strokeWidth: 2,
                }}
                label={<CustomLabel />}
                // Updated styling for better visibility
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            {" "}
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-brand-400)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-brand-400)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-primary)"
              />
              <XAxis
                dataKey="name"
                stroke="var(--color-text-secondary)"
                fontSize={12}
                fontFamily="var(--font-outfit)"
              />
              <YAxis
                stroke="var(--color-text-secondary)"
                fontSize={12}
                fontFamily="var(--font-outfit)"
                domain={yAxisDomain}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-brand-400)",
                  borderRadius: "8px",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-outfit)",
                  boxShadow: "0 4px 20px var(--color-brand-400)/20",
                }}
                labelStyle={{
                  color: "var(--color-brand-400)",
                  fontFamily: "var(--font-outfit)",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-brand-400)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="var(--color-brand-400)"
                dataKey="value"
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>{" "}
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-brand-400)",
                  borderRadius: "8px",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-outfit)",
                  boxShadow: "0 4px 20px var(--color-brand-400)/20",
                }}
                labelStyle={{
                  color: "var(--color-brand-400)",
                  fontFamily: "var(--font-outfit)",
                }}
              />
              <Legend
                wrapperStyle={{
                  fontFamily: "var(--font-outfit)",
                  color: "var(--color-text-primary)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...commonProps}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-primary)"
              />{" "}
              <XAxis
                dataKey="name"
                stroke="var(--color-text-secondary)"
                fontSize={12}
                fontFamily="var(--font-outfit)"
              />
              <YAxis
                stroke="var(--color-text-secondary)"
                fontSize={12}
                fontFamily="var(--font-outfit)"
                domain={yAxisDomain}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-brand-400)",
                  borderRadius: "8px",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-outfit)",
                  boxShadow: "0 4px 20px var(--color-brand-400)/20",
                }}
                labelStyle={{
                  color: "var(--color-brand-400)",
                  fontFamily: "var(--font-outfit)",
                }}
              />
              <Bar
                dataKey="value"
                fill="var(--color-brand-400)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 pt-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-outfit">
          {title}
        </h3>
        {filterComponent && (
          <div className="flex items-center gap-2">{filterComponent}</div>
        )}
      </div>
      
      {/* Chart Container */}
      <div className="widget-content-area px-4 pb-4">
        {finalData && finalData.length > 0 ? (
          <div
            className={`w-full h-full ${
              type === "line" ? "p-4" : ""
            }`}
          >
            {renderChart()}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyStateWithAddHabit onAddHabit={onAddHabit} className="max-w-md" />
          </div>
        )}
      </div>
    </div>
  );
};

ChartWidget.displayName = "ChartWidget";

export default ChartWidget;
