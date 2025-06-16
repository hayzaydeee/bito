import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const ChartWidget = ({ 
  title, 
  type = 'bar', 
  data = [], 
  color = '#3B82F6',
  breakpoint = 'lg', 
  availableColumns = 8, 
  availableRows = 4, 
  size = { width: 320, height: 200 },
  widgetConfig = {}
}) => {
  const defaultData = [
    { name: 'Mon', value: 4 },
    { name: 'Tue', value: 3 },
    { name: 'Wed', value: 5 },
    { name: 'Thu', value: 2 },
    { name: 'Fri', value: 6 },
    { name: 'Sat', value: 4 },
    { name: 'Sun', value: 3 },
  ];

  const pieData = [
    { name: 'Completed', value: 27, color: '#22C55E' },
    { name: 'Missed', value: 8, color: '#EF4444' },
  ];

  // Use provided data or default data
  const chartData = data.length > 0 ? data : defaultData;

  // Responsive configuration based on breakpoint
  const chartConfig = useMemo(() => {
    const config = {
      chartType: type,
      showLegend: widgetConfig.showLegend !== false,
      showAxes: widgetConfig.showAxes !== false,
      showGrid: true,
      ...widgetConfig
    };

    switch (breakpoint) {
      case 'xs':
        return {
          ...config,
          showLegend: false,
          showAxes: false,
          showGrid: false,
        };
      case 'sm':
        return {
          ...config,
          showLegend: false,
          showAxes: availableRows > 3,
          showGrid: availableRows > 3,
        };
      case 'md':
        return {
          ...config,
          showLegend: availableColumns > 4,
          showAxes: true,
          showGrid: true,
        };
      default:
        return config;
    }
  }, [widgetConfig, breakpoint, availableColumns, availableRows, type]);

  // Simple stats for very small widgets
  if (breakpoint === 'xs') {
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const avg = chartData.length > 0 ? Math.round(total / chartData.length) : 0;

    return (
      <div className="h-full flex flex-col">
        <div className="text-xs font-medium mb-2 truncate text-gray-600">
          {title || 'Progress'}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color }}>
              {total}
            </div>
            <div className="text-xs text-gray-500">total</div>
            <div className="text-sm text-gray-400 mt-1">
              avg: {avg}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data: chartConfig.chartType === 'pie' ? pieData : chartData,
      margin: breakpoint === 'sm' 
        ? { top: 5, right: 5, left: 5, bottom: 5 } 
        : { top: 10, right: 20, left: 10, bottom: 5 }
    };

    switch (chartConfig.chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            {chartConfig.showAxes && (
              <XAxis 
                dataKey="name" 
                stroke="#6B7280"
                fontSize={breakpoint === 'sm' ? 10 : 12}
              />
            )}
            {chartConfig.showAxes && (
              <YAxis 
                stroke="#6B7280"
                fontSize={breakpoint === 'sm' ? 10 : 12}
              />
            )}
            <Tooltip 
              contentStyle={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            {chartConfig.showLegend && availableColumns > 6 && <Legend />}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              strokeWidth={breakpoint === 'sm' ? 2 : 3}
              dot={{ fill: color, strokeWidth: 2, r: breakpoint === 'sm' ? 3 : 4 }}
              activeDot={{ r: breakpoint === 'sm' ? 4 : 6 }}
            />
          </LineChart>
        );
      
      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={breakpoint === 'sm' ? 25 : 40}
              outerRadius={breakpoint === 'sm' ? 50 : 80}
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
          <BarChart {...commonProps}>
            {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            {chartConfig.showAxes && (
              <XAxis 
                dataKey="name" 
                stroke="#6B7280"
                fontSize={breakpoint === 'sm' ? 10 : 12}
              />
            )}
            {chartConfig.showAxes && (
              <YAxis 
                stroke="#6B7280"
                fontSize={breakpoint === 'sm' ? 10 : 12}
              />
            )}
            <Tooltip 
              contentStyle={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            {chartConfig.showLegend && availableColumns > 6 && <Legend />}
            <Bar 
              dataKey="value" 
              fill={color}
              radius={[breakpoint === 'sm' ? 2 : 4, breakpoint === 'sm' ? 2 : 4, 0, 0]}
            />
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {title && (
        <div className="mb-2 flex-shrink-0">
          <h4 className={`font-medium text-gray-700 dark:text-gray-300 truncate ${
            breakpoint === 'sm' ? 'text-xs' : 'text-sm'
          }`}>
            {title}
          </h4>
        </div>
      )}
      
      <div className="flex-1 min-h-0">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p className={breakpoint === 'sm' ? 'text-xs' : 'text-sm'}>
              No data available
            </p>
          </div>
        )}
      </div>

      {/* Quick stats for medium+ widgets */}
      {breakpoint !== 'xs' && breakpoint !== 'sm' && availableRows > 3 && chartData.length > 0 && (
        <div className="flex justify-around pt-2 mt-2 border-t border-gray-100 text-xs flex-shrink-0">
          <div className="text-center">
            <div className="font-semibold" style={{ color }}>
              {chartData.reduce((sum, item) => sum + item.value, 0)}
            </div>
            <div className="text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">
              {Math.round((chartData.reduce((sum, item) => sum + item.value, 0) / (chartData.length * 5)) * 100)}%
            </div>
            <div className="text-gray-500">Success</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">
              {Math.max(...chartData.map(item => item.value))}
            </div>
            <div className="text-gray-500">Best</div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ChartWidget };
