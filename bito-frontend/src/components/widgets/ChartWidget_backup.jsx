import { useMemo, memo, useState, useEffect, useRef } from "react";
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

// Custom Tooltip with enhanced styling
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-900">{`${label}`}</p>
        <p className="text-sm text-gray-600">
          <span className="font-medium" style={{ color: payload[0].color }}>
            {`${payload[0].name}: ${payload[0].value}`}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

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
    const [isAnimating, setIsAnimating] = useState(true);
    const [animatedData, setAnimatedData] = useState([]);
    const lastDataHash = useRef("");

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

    // Safe animation effect using hash comparison to prevent infinite loops
    useEffect(() => {
      const dataHash = JSON.stringify(finalData);
      
      if (dataHash !== lastDataHash.current) {
        lastDataHash.current = dataHash;
        
        if (type === "bar" && finalData.length > 0) {
          setIsAnimating(true);
          
          // Start with zero values for animation
          const zeroData = finalData.map((item) => ({ ...item, value: 0 }));
          setAnimatedData(zeroData);

          // Animate to actual values with staggered delays
          finalData.forEach((item, index) => {
            setTimeout(() => {
              setAnimatedData((prev) =>
                prev.map((prevItem, prevIndex) =>
                  prevIndex === index ? { ...prevItem, value: item.value } : prevItem
                )
              );
            }, index * 50); // 50ms stagger for smooth animation
          });

          // Mark animation as complete
          setTimeout(() => {
            setIsAnimating(false);
          }, finalData.length * 50 + 300);
        } else {
          // For non-bar charts, just set the data directly
          setAnimatedData(finalData);
          setIsAnimating(false);
        }
      }
    }, [finalData, type]);

    // Use animated data for bar charts, final data for others
    const displayData = type === "bar" ? animatedData : finalData;

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
      data: displayData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    const renderChart = () => {
      switch (type) {
        case "line":
          return (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart {...commonProps}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="var(--color-border-primary)" 
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={yAxisDomain}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color} 
                  strokeWidth={3}
                  dot={{ r: 4, fill: color }}
                  activeDot={{ r: 6, fill: color }}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          );

        case "area":
          return (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart {...commonProps}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="var(--color-border-primary)" 
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={yAxisDomain}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color} 
                  strokeWidth={2}
                  fill="url(#areaGradient)"
                  animationDuration={800}
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
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={800}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          );

        case "bar":
        default:
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart {...commonProps}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.9} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="var(--color-border-primary)" 
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={yAxisDomain}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  fill="url(#barGradient)"
                  radius={[4, 4, 0, 0]}
                  animationDuration={0} // Disable recharts animation since we handle it manually
                />
              </BarChart>
            </ResponsiveContainer>
          );
      }
    };

    return (
      <div className="w-full h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {filterComponent && (
            <div className="flex items-center gap-2">
              {filterComponent}
            </div>
          )}
        </div>
        
        <div className="p-4">
          {displayData && displayData.length > 0 ? (
            <div style={{ width: "100%", height: size.height || 200 }}>
              {renderChart()}
            </div>
          ) : (
            <div 
              className="flex items-center justify-center text-gray-500"
              style={{ height: size.height || 200 }}
            >
              <div className="text-center">
                <div className="text-lg mb-2">📊</div>
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
