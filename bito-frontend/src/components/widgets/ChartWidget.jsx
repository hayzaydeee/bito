import { useMemo, memo, useState, useEffect } from "react";
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

export const ChartWidget = memo(
  ({
    title,
    type = "bar",
    data = [],
    color = "#3B82F6",
    breakpoint = "lg",
    availableColumns = 8,
    availableRows = 4,
    size = { width: 320, height: 200 },
    widgetConfig = {},
    filterComponent = null,
  }) => {
    const [isAnimating, setIsAnimating] = useState(true);
    const [animatedData, setAnimatedData] = useState([]);

    const defaultData = [
      { name: "Mon", value: 8 },
      { name: "Tue", value: 6 },
      { name: "Wed", value: 8 },
      { name: "Thu", value: 7 },
      { name: "Fri", value: 9 },
      { name: "Sat", value: 5 },
      { name: "Sun", value: 8 },
      { name: "Mon", value: 4 },
      { name: "Tue", value: 7 },
      { name: "Wed", value: 8 },
      { name: "Thu", value: 6 },
      { name: "Fri", value: 9 },
      { name: "Sat", value: 8 },
      { name: "Sun", value: 7 },
    ];

    const pieData = [
      { name: "Completed", value: 27, color: "#22C55E" },
      { name: "Missed", value: 8, color: "#EF4444" },
    ];

    // Use provided data or default data
    const chartData = data.length > 0 ? data : defaultData;    // Determine Y-axis domain based on data type
    const getYAxisDomain = () => {
      // All modes now use habit count, so use the same domain
      return [0, "dataMax + 1"];
    };

    // Animation effect for bars
    useEffect(() => {
      if (type === "bar") {
        setIsAnimating(true);

        // Start with zero values
        const zeroData = chartData.map((item) => ({ ...item, value: 0 }));
        setAnimatedData(zeroData);

        // Animate to actual values with staggered delays
        chartData.forEach((item, index) => {
          setTimeout(() => {
            setAnimatedData((prev) =>
              prev.map((prevItem, prevIndex) =>
                prevIndex === index
                  ? { ...prevItem, value: item.value }
                  : prevItem
              )
            );
          }, index * 100); // 100ms delay between each bar
        });

        // Mark animation as complete
        setTimeout(() => {
          setIsAnimating(false);
        }, chartData.length * 100 + 500);
      } else {
        setAnimatedData(chartData);
        setIsAnimating(false);
      }
    }, [chartData, type]);

    // Custom animated bar component
    const AnimatedBar = ({ payload, x, y, width, height, fill }) => {
      const [currentHeight, setCurrentHeight] = useState(0);

      useEffect(() => {
        const targetHeight = height;
        let startTime = null;
        const duration = 800; // Animation duration in ms

        const animate = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);

          // Easing function for smooth animation
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          setCurrentHeight(targetHeight * easeOutCubic);

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      }, [height]);

      return (
        <rect
          x={x}
          y={y + height - currentHeight}
          width={width}
          height={currentHeight}
          fill={fill}
          rx="6"
          ry="6"
          style={{
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
            transition: "all 0.3s ease",
          }}
        />
      );
    };

    // Create a safe gradient ID from color
    const gradientId = useMemo(() => {
      if (color.startsWith("var(")) {
        // Extract CSS variable name and create safe ID
        const varName = color.match(/var\(--([^)]+)\)/)?.[1] || "default";
        return varName.replace(/-/g, "");
      }
      return color.replace("#", "");
    }, [color]);

    // Responsive configuration based on breakpoint
    const chartConfig = useMemo(() => {
      const config = {
        chartType: type,
        showLegend: widgetConfig.showLegend !== false,
        showAxes: widgetConfig.showAxes !== false,
        showGrid: true,
        ...widgetConfig,
      };

      switch (breakpoint) {
        case "xs":
          return {
            ...config,
            showLegend: false,
            showAxes: false,
            showGrid: false,
          };
        case "sm":
          return {
            ...config,
            showLegend: false,
            showAxes: availableRows > 3,
            showGrid: availableRows > 3,
          };
        case "md":
          return {
            ...config,
            showLegend: availableColumns > 4,
            showAxes: true,
            showGrid: true,
          };
        default:
          return config;
      }
    }, [widgetConfig, breakpoint, availableColumns, availableRows, type]); // Simple stats for very small widgets
    if (breakpoint === "xs") {
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      const avg =
        chartData.length > 0 ? Math.round(total / chartData.length) : 0;

      return (
        <div className="h-full flex flex-col">
          <div className="text-xs font-medium mb-2 truncate text-[var(--color-text-secondary)] font-outfit">
            {title || "Progress"}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div
                className={`text-xl font-bold font-dmSerif transition-all duration-1000 ${
                  isAnimating ? "transform scale-110" : ""
                }`}
                style={{ color }}
              >
                {isAnimating ? "..." : total}
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                total
              </div>
              <div className="text-sm text-[var(--color-text-secondary)] mt-1 font-outfit">
                avg: {isAnimating ? "..." : avg}
              </div>
            </div>
          </div>
        </div>
      );
    }

    const renderChart = () => {
      const commonProps = {
        data: chartConfig.chartType === "pie" ? pieData : chartData,
        margin:
          breakpoint === "sm"
            ? { top: 20, right: 5, left: 5, bottom: 5 }
            : { top: 30, right: 10, left: 0, bottom: 10 },
      };
      switch (chartConfig.chartType) {
        case "line":
          return (
            <LineChart {...commonProps}>
              {/* Minimal grid - only horizontal lines */}
              {chartConfig.showGrid && (
                <CartesianGrid
                  strokeDasharray="none"
                  stroke="var(--color-border-primary)"
                  strokeOpacity={0.2}
                  horizontal={true}
                  vertical={false}
                />
              )}
              {chartConfig.showAxes && (
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "var(--color-text-tertiary)",
                    fontFamily: "var(--font-outfit)",
                  }}
                  dy={5}
                />
              )}              {chartConfig.showAxes && (
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "var(--color-text-tertiary)",
                    fontFamily: "var(--font-outfit)",
                  }}
                  width={25}
                  domain={getYAxisDomain()}
                  allowDecimals={false}
                />              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-border-primary)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "var(--font-outfit)",
                  color: "var(--color-text-primary)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
                labelStyle={{
                  color: "var(--color-text-secondary)",
                  marginBottom: "4px",
                }}                formatter={(value, name, props) => {
                  const payload = props?.payload;
                  return [
                    `${value} habit${value !== 1 ? "s" : ""} completed`,
                    payload?.fullName || name,
                  ];
                }}
              />{" "}
              {/* Clean line with dots and labels */}
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={3}
                dot={{
                  fill: color,
                  strokeWidth: 0,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  fill: color,
                  stroke: "var(--color-surface-primary)",
                  strokeWidth: 2,
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                }}
                label={{
                  position: "top",
                  offset: 10,
                  fontSize: 12,
                  fill: "var(--color-text-primary)",
                  fontFamily: "var(--font-outfit)",
                  fontWeight: 500,
                }}
              />{" "}
              {/* Gradient definition for line */}
              <defs>
                <linearGradient
                  id={`lineGradient-${gradientId}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.1} />
                </linearGradient>
              </defs>
            </LineChart>
          );

        case "area":
          return (
            <AreaChart {...commonProps}>
              {/* Minimal grid - only horizontal lines */}
              {chartConfig.showGrid && (
                <CartesianGrid
                  strokeDasharray="none"
                  stroke="var(--color-border-primary)"
                  strokeOpacity={0.2}
                  horizontal={true}
                  vertical={false}
                />
              )}
              {chartConfig.showAxes && (
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "var(--color-text-tertiary)",
                    fontFamily: "var(--font-outfit)",
                  }}
                  dy={5}
                />
              )}{" "}
              {chartConfig.showAxes && (
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "var(--color-text-tertiary)",
                    fontFamily: "var(--font-outfit)",
                  }}                  width={25}
                  domain={getYAxisDomain()}
                  allowDecimals={false}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-border-primary)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "var(--font-outfit)",
                  color: "var(--color-text-primary)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
                labelStyle={{
                  color: "var(--color-text-secondary)",
                  marginBottom: "4px",
                }}                formatter={(value, name, props) => {
                  const payload = props?.payload;
                  return [
                    `${value} habit${value !== 1 ? "s" : ""} completed`,
                    payload?.fullName || name,
                  ];
                }}
              />{" "}
              {/* Area fill with gradient and labels */}
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={3}
                fill={`url(#areaGradient-${gradientId})`}
                dot={{
                  fill: color,
                  strokeWidth: 0,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  fill: color,
                  stroke: "var(--color-surface-primary)",
                  strokeWidth: 2,
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                }}
                label={{
                  position: "top",
                  offset: 10,
                  fontSize: 12,
                  fill: "var(--color-text-primary)",
                  fontFamily: "var(--font-outfit)",
                  fontWeight: 500,
                }}
              />
              {/* Gradient definition for area */}
              <defs>
                <linearGradient
                  id={`areaGradient-${gradientId}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
            </AreaChart>
          );

        case "pie":
          return (
            <PieChart {...commonProps}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={breakpoint === "sm" ? 25 : 40}
                outerRadius={breakpoint === "sm" ? 50 : 80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              {chartConfig.showLegend && availableColumns > 4 && <Legend />}
            </PieChart>
          );
        default: // bar chart
          return (
            <BarChart
              {...commonProps}
              data={type === "bar" ? animatedData : chartData}
            >
              {/* Minimal grid - only horizontal lines */}
              {chartConfig.showGrid && (
                <CartesianGrid
                  strokeDasharray="none"
                  stroke="var(--color-border-primary)"
                  strokeOpacity={0.2}
                  horizontal={true}
                  vertical={false}
                />
              )}
              {chartConfig.showAxes && (
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "var(--color-text-tertiary)",
                    fontFamily: "var(--font-outfit)",
                  }}
                  dy={5}
                />
              )}
              {chartConfig.showAxes && (
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "var(--color-text-tertiary)",
                    fontFamily: "var(--font-outfit)",
                  }}
                  width={25}
                  domain={getYAxisDomain()}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-border-primary)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "var(--font-outfit)",
                  color: "var(--color-text-primary)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
                labelStyle={{
                  color: "var(--color-text-secondary)",
                  marginBottom: "4px",
                }}
                animationDuration={300}
              />
              <Bar
                dataKey="value"
                fill={`url(#barGradient-${gradientId})`}
                radius={[6, 6, 0, 0]}
                stroke="none"
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              />
              {/* Gradient definition for bars */}
              <defs>
                <linearGradient
                  id={`barGradient-${gradientId}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                </linearGradient>
                {/* Add a subtle glow effect for animation */}
                <filter id={`barGlow-${gradientId}`}>
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </BarChart>
          );
      }
    };
    return (
      <div className="w-full h-full flex flex-col">
        {(title || filterComponent) && (
          <div className="mb-2 flex-shrink-0 flex items-center justify-between">
            {title && (
              <h4
                className={`font-medium text-[var(--color-text-secondary)] truncate font-dmSerif ${
                  breakpoint === "sm" ? "text-xs" : "text-sm"
                }`}
              >
                {title}
              </h4>
            )}
            {filterComponent && (
              <div className="flex-shrink-0 ml-2">{filterComponent}</div>
            )}
          </div>
        )}{" "}
        <div
          className={`flex-1 min-h-0 relative ${
            isAnimating && type === "bar" ? "overflow-hidden" : ""
          }`}
        >
          {" "}
          {/* Loading shimmer overlay */}
          {isAnimating && type === "bar" && (
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            </div>
          )}
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--color-text-tertiary)]">
              <p
                className={`font-outfit ${
                  breakpoint === "sm" ? "text-xs" : "text-sm"
                }`}
              >
                No data available
              </p>
            </div>
          )}
        </div>
        {/* Quick stats for medium+ widgets */}
        {breakpoint !== "xs" &&
          breakpoint !== "sm" &&
          availableRows > 3 &&
          chartData.length > 0 && (
            <div className="flex justify-around pt-2 mt-2 border-t border-[var(--color-border-primary)] text-xs flex-shrink-0 font-outfit">
              <div className="text-center">
                <div
                  className={`font-semibold font-dmSerif transition-all duration-500 ${
                    isAnimating ? "opacity-60" : "opacity-100"
                  }`}
                  style={{ color }}
                >
                  {isAnimating
                    ? "..."
                    : chartData.reduce((sum, item) => sum + item.value, 0)}
                </div>
                <div className="text-[var(--color-text-tertiary)]">Total</div>
              </div>
              <div className="text-center">
                <div
                  className={`font-semibold text-[var(--color-success)] font-dmSerif transition-all duration-500 ${
                    isAnimating ? "opacity-60" : "opacity-100"
                  }`}
                >
                  {isAnimating
                    ? "..."
                    : Math.round(
                        (chartData.reduce((sum, item) => sum + item.value, 0) /
                          (chartData.length * 5)) *
                          100
                      )}
                  {!isAnimating && "%"}
                </div>
                <div className="text-[var(--color-text-tertiary)]">Success</div>
              </div>
              <div className="text-center">
                <div
                  className={`font-semibold text-[var(--color-brand-400)] font-dmSerif transition-all duration-500 ${
                    isAnimating ? "opacity-60" : "opacity-100"
                  }`}
                >
                  {isAnimating
                    ? "..."
                    : Math.max(...chartData.map((item) => item.value))}
                </div>
                <div className="text-[var(--color-text-tertiary)]">Best</div>
              </div>
            </div>
          )}
      </div>
    );
  }
);

ChartWidget.displayName = "ChartWidget";
