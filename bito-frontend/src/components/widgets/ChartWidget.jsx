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
import "./widgets.css";

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
    <div className="w-full h-full flex flex-col rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-outfit">
          {title}
        </h3>
        {filterComponent && (
          <div className="flex items-center gap-2">{filterComponent}</div>
        )}
      </div>{" "}
      {/* Chart Container */}
      <div className="flex-1 min-h-0">
        {finalData && finalData.length > 0 ? (
          <div
            className={`w-full h-full ${
              type === "line" ? "p-4" : ""
            }`}
          >
            {renderChart()}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[var(--color-text-secondary)]">
              <div className="text-sm mb-3">No habit data available</div>
              {onAddHabit && (
                <button
                  onClick={onAddHabit}
                  className="px-4 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg transition-colors duration-200 text-sm flex items-center gap-2 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Habit
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ChartWidget.displayName = "ChartWidget";

export default ChartWidget;
