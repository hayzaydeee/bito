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
import { useChartData } from "../../hooks/useChartData";

export const ChartWidget = memo(
  ({
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
  }) => {
    // Get real habit data based on chart type
    const habitChartData = useChartData(chartType, dateRange);
    
    // Use real data if available, otherwise fall back to provided data or default
    const finalData = useMemo(() => {
      if (habitChartData && habitChartData.length > 0) {
        return habitChartData;
      }
      
      if (data && data.length > 0) {
        return data;
      }
      
      // Fallback default data
      return [
        { name: "Mon", value: 0 },
        { name: "Tue", value: 0 },
        { name: "Wed", value: 0 },
        { name: "Thu", value: 0 },
        { name: "Fri", value: 0 },
        { name: "Sat", value: 0 },
        { name: "Sun", value: 0 },
      ];
    }, [habitChartData, data]);

    const pieData = [
      { name: "Completed", value: 27, color: "#22C55E" },
      { name: "Missed", value: 8, color: "#EF4444" },
    ];

    // Determine Y-axis domain based on data type
    const yAxisDomain = useMemo(() => {
      if (!finalData || finalData.length === 0) return [0, 100];
      
      const maxValue = Math.max(...finalData.map(item => item.value || 0));
      
      // For percentage data, cap at 100
      if (chartType === 'completion' || maxValue <= 100) {
        return [0, 100];
      }
      
      // For other data, add some padding
      return [0, Math.ceil(maxValue * 1.1)];
    }, [finalData, chartType]);

    const commonProps = {
      width: size.width,
      height: size.height,
      data: finalData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    const renderChart = () => {
      switch (type) {
        case "line":
          return (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                  domain={yAxisDomain}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface-elevated)",
                    border: "1px solid var(--color-border-primary)",
                    borderRadius: "8px",
                    color: "var(--color-text-primary)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={{ fill: color, strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          );

        case "area":
          return (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                  domain={yAxisDomain}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface-elevated)",
                    border: "1px solid var(--color-border-primary)",
                    borderRadius: "8px",
                    color: "var(--color-text-primary)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  fill={color}
                  fillOpacity={0.3}
                  strokeWidth={2}
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
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface-elevated)",
                    border: "1px solid var(--color-border-primary)",
                    borderRadius: "8px",
                    color: "var(--color-text-primary)",
                  }}
                />
                <Legend
                  wrapperStyle={{
                    color: "var(--color-text-primary)",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          );

        default: // bar chart
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                  domain={yAxisDomain}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface-elevated)",
                    border: "1px solid var(--color-border-primary)",
                    borderRadius: "8px",
                    color: "var(--color-text-primary)",
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill={color}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          );
      }
    };

    return (
      <div className="w-full h-full flex flex-col bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-outfit">
            {title}
          </h3>
          {filterComponent && (
            <div className="flex-shrink-0">
              {filterComponent}
            </div>
          )}
        </div>

        {/* Chart Container */}
        <div className="flex-1 min-h-0">
          {finalData && finalData.length > 0 ? (
            renderChart()
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)]">
              <div className="text-center">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-sm">No data available</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ChartWidget.displayName = "ChartWidget";

export default ChartWidget;
