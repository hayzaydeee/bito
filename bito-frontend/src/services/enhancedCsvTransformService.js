/**
 * Enhanced CSV Transform Service
 * Handles transformation from LLM mappings to Bito data structures
 * Integrates with existing HabitContext and Zustand store
 */

/**
 * Smart CSV transformation based on LLM-generated mappings
 */
export class EnhancedCsvTransformService {
  constructor(mappings, csvData) {
    this.mappings = mappings;
    this.csvData = csvData;
    this.transformers = new Map();
    this.setupTransformers();
  }

  setupTransformers() {
    // Boolean transformer with enhanced pattern recognition
    this.transformers.set('boolean', (value) => {
      if (!value && value !== 0) return false;
      
      const normalized = String(value).toLowerCase().trim();
      const trueValues = [
        'yes', 'y', 'true', '1', 'done', 'completed', 'complete', 'finished',
        'x', '✓', '✅', 'check', 'checked', 'success', 'accomplished', 'achieved'
      ];
      
      return trueValues.includes(normalized);
    });

    // Numeric transformer with unit handling
    this.transformers.set('numeric', (value) => {
      if (!value && value !== 0) return 0;
      
      // Handle common units and formatting
      let numStr = String(value)
        .replace(/[,$%]/g, '') // Remove currency, commas, percentages
        .replace(/\s*(mins?|minutes?|hrs?|hours?|secs?|seconds?|steps?|reps?)\s*/gi, '') // Remove units
        .trim();
      
      const num = parseFloat(numStr);
      return isNaN(num) ? 0 : num;
    });

    // Date transformer with flexible parsing
    this.transformers.set('date', (value) => {
      if (!value) return null;
      
      try {
        // Handle @ symbol and various formats
        let cleanDate = String(value).replace('@', '').trim();
        const date = new Date(cleanDate);
        
        if (isNaN(date.getTime())) {
          return null;
        }
        
        // Return YYYY-MM-DD format
        return date.toISOString().split('T')[0];
      } catch {
        return null;
      }
    });

    // Text transformer with cleanup
    this.transformers.set('text', (value) => {
      if (!value) return '';
      return String(value).trim().replace(/\s+/g, ' '); // Normalize whitespace
    });
  }

  /**
   * Transform CSV data according to LLM mappings
   */
  transformData() {
    const results = {
      habits: [],
      completions: [],
      widgets: [],
      errors: [],
      metadata: {
        totalRows: this.csvData.data.length,
        processedRows: 0,
        skippedRows: 0,
        dateRange: null
      }
    };

    try {
      // Find date column
      const dateColumn = this.findDateColumn();
      
      if (!dateColumn) {
        results.errors.push('No date column found. Time-based tracking will not be available.');
      }

      // Process each mapping
      this.mappings.forEach((mapping, index) => {
        try {
          if (mapping.targetWidget === 'habit-tracker') {
            this.processHabitMapping(mapping, dateColumn, results, index);
          } else if (mapping.targetWidget === 'counter') {
            this.processCounterMapping(mapping, dateColumn, results, index);
          } else if (mapping.targetWidget === 'chart') {
            this.processChartMapping(mapping, dateColumn, results, index);
          }
          // Add more widget types as needed
        } catch (error) {
          results.errors.push(`Error processing mapping for ${mapping.sourceColumn}: ${error.message}`);
        }
      });

      // Calculate date range
      if (results.completions.length > 0) {
        const dates = results.completions.map(c => c.date).sort();
        results.metadata.dateRange = {
          start: dates[0],
          end: dates[dates.length - 1]
        };
      }

      results.metadata.processedRows = this.csvData.data.length - results.metadata.skippedRows;

    } catch (error) {
      results.errors.push(`Transform failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Find the primary date column
   */
  findDateColumn() {
    // Check if any mapping explicitly defines a date column
    const dateMapping = this.mappings.find(m => m.targetWidget === 'calendar');
    if (dateMapping) return dateMapping.sourceColumn;

    // Auto-detect date column
    for (const field of this.csvData.meta.fields) {
      if (this.isLikelyDateColumn(field)) {
        return field;
      }
    }

    return null;
  }

  isLikelyDateColumn(columnName) {
    const dateKeywords = ['date', 'day', 'time', 'when', 'timestamp'];
    const name = columnName.toLowerCase();
    return dateKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Process habit-tracker mapping
   */
  processHabitMapping(mapping, dateColumn, results, habitIndex) {
    // Create habit
    const habit = this.createHabit(mapping, habitIndex);
    results.habits.push(habit);

    // Create widget configuration
    const widget = this.createWidget(mapping, habit);
    results.widgets.push(widget);

    // Extract completions if date column exists
    if (dateColumn) {
      const completions = this.extractHabitCompletions(mapping, habit.id, dateColumn);
      results.completions.push(...completions);
    }
  }

  /**
   * Process counter mapping
   */
  processCounterMapping(mapping, dateColumn, results, index) {
    const widget = this.createWidget(mapping, null, { type: 'counter' });
    results.widgets.push(widget);

    if (dateColumn) {
      // Extract counter data and store as special completion type
      const counterData = this.extractCounterData(mapping, dateColumn);
      
      // Convert counter data to completion-like entries for storage
      counterData.data.forEach(entry => {
        results.completions.push({
          id: `counter_${mapping.sourceColumn}_${entry.date}`,
          habitId: `counter_${index}`,
          date: entry.date,
          completed: true,
          value: entry.value,
          type: 'counter',
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  /**
   * Process chart mapping
   */
  processChartMapping(mapping, dateColumn, results, index) {
    const widget = this.createWidget(mapping, null, { type: 'chart' });
    results.widgets.push(widget);

    if (dateColumn) {
      const chartData = this.extractChartData(mapping, dateColumn);
      
      // Store chart data points
      chartData.data.forEach(entry => {
        results.completions.push({
          id: `chart_${mapping.sourceColumn}_${entry.date}`,
          habitId: `chart_${index}`,
          date: entry.date,
          completed: true,
          value: entry.value,
          type: 'chart',
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  /**
   * Create habit from mapping (compatible with existing Bito structure)
   */
  createHabit(mapping, habitIndex) {
    const config = mapping.config || {};
    
    return {
      id: `imported_${Date.now()}_${habitIndex}`,
      _id: `imported_${Date.now()}_${habitIndex}`, // MongoDB compatibility
      name: config.name || mapping.sourceColumn,
      color: config.color || this.getColorForCategory(config.category),
      icon: config.icon || this.getIconForCategory(config.category),
      category: config.category || 'general',
      createdAt: new Date().toISOString(),
      source: 'csv-import',
      sourceMapping: {
        column: mapping.sourceColumn,
        confidence: mapping.confidence,
        reasoning: mapping.reasoning
      }
    };
  }

  /**
   * Extract habit completions from CSV data
   */
  extractHabitCompletions(mapping, habitId, dateColumn) {
    if (!dateColumn) return [];

    const completions = [];
    const transformer = this.getTransformer(mapping.targetWidget);
    const dateTransformer = this.transformers.get('date');

    this.csvData.data.forEach((row, index) => {
      const dateStr = dateTransformer(row[dateColumn]);
      if (!dateStr) return;

      const value = row[mapping.sourceColumn];
      const isCompleted = transformer(value);

      if (isCompleted) {
        completions.push({
          id: `${dateStr}_${habitId}`,
          habitId: habitId,
          date: dateStr,
          completed: true,
          timestamp: new Date().toISOString(),
          source: 'csv-import'
        });
      }
    });

    return completions;
  }

  /**
   * Extract counter data
   */
  extractCounterData(mapping, dateColumn) {
    const transformer = this.getTransformer('numeric');
    const dateTransformer = this.transformers.get('date');
    
    const data = this.csvData.data
      .map((row, index) => ({
        date: dateTransformer(row[dateColumn]),
        value: transformer(row[mapping.sourceColumn]),
        originalValue: row[mapping.sourceColumn],
        rowIndex: index
      }))
      .filter(item => item.date !== null);

    return {
      data,
      summary: {
        total: data.reduce((sum, item) => sum + item.value, 0),
        average: data.length > 0 ? data.reduce((sum, item) => sum + item.value, 0) / data.length : 0,
        min: data.length > 0 ? Math.min(...data.map(item => item.value)) : 0,
        max: data.length > 0 ? Math.max(...data.map(item => item.value)) : 0
      }
    };
  }

  /**
   * Extract chart data
   */
  extractChartData(mapping, dateColumn) {
    // Chart data is similar to counter data but with additional chart-specific processing
    const baseData = this.extractCounterData(mapping, dateColumn);
    
    return {
      ...baseData,
      chartConfig: {
        type: mapping.config?.chartType || 'line',
        showTrend: mapping.config?.showTrend !== false,
        smoothing: mapping.config?.smoothing || false
      }
    };
  }

  /**
   * Create widget configuration
   */
  createWidget(mapping, habit = null, options = {}) {
    const baseWidget = {
      id: `${mapping.targetWidget}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: mapping.targetWidget,
      title: mapping.config?.name || mapping.sourceColumn,
      sourceColumn: mapping.sourceColumn,
      position: { x: 0, y: 0, width: 2, height: 2 }, // Default position
      config: { ...mapping.config },
      metadata: {
        confidence: mapping.confidence,
        reasoning: mapping.reasoning,
        source: 'csv-import'
      }
    };

    // Widget-specific configurations
    switch (mapping.targetWidget) {
      case 'habit-tracker':
        return {
          ...baseWidget,
          habitId: habit?.id,
          config: {
            ...baseWidget.config,
            showStreak: true,
            showProgress: true
          }
        };

      case 'counter':
        return {
          ...baseWidget,
          config: {
            ...baseWidget.config,
            showTotal: true,
            showAverage: true,
            unit: mapping.config?.unit || ''
          }
        };

      case 'chart':
        return {
          ...baseWidget,
          config: {
            ...baseWidget.config,
            chartType: mapping.config?.chartType || 'line',
            showGrid: true,
            showLegend: true
          }
        };

      default:
        return baseWidget;
    }
  }

  /**
   * Get appropriate transformer for widget type
   */
  getTransformer(widgetType) {
    const transformerMap = {
      'habit-tracker': 'boolean',
      'counter': 'numeric',
      'chart': 'numeric',
      'progress-bar': 'numeric',
      'calendar': 'date',
      'text': 'text'
    };

    const transformerType = transformerMap[widgetType] || 'text';
    return this.transformers.get(transformerType);
  }

  /**
   * Get color for category
   */
  getColorForCategory(category) {
    const colors = {
      exercise: '#f59e0b',
      wellness: '#3b82f6',
      productivity: '#10b981',
      social: '#ec4899',
      creativity: '#8b5cf6',
      general: '#6b7280'
    };
    return colors[category] || colors.general;
  }

  /**
   * Get icon for category
   */
  getIconForCategory(category) {
    const icons = {
      exercise: '💪',
      wellness: '🧘',
      productivity: '📚',
      social: '👥',
      creativity: '🎨',
      general: '✅'
    };
    return icons[category] || icons.general;
  }
}

/**
 * Apply CSV mappings and transform data
 */
export const applyCsvMappings = (csvData, mappings) => {
  if (!csvData || !mappings || mappings.length === 0) {
    throw new Error('Invalid CSV data or mappings');
  }

  const transformer = new EnhancedCsvTransformService(mappings, csvData);
  return transformer.transformData();
};

/**
 * Validate mappings before transformation
 */
export const validateMappings = (csvData, mappings) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };

  const availableColumns = csvData.meta.fields;

  mappings.forEach((mapping, index) => {
    // Check if source column exists
    if (!availableColumns.includes(mapping.sourceColumn)) {
      validation.errors.push(`Row ${index + 1}: Column "${mapping.sourceColumn}" not found in CSV`);
      validation.isValid = false;
    }

    // Check if widget type is valid
    const validWidgetTypes = ['habit-tracker', 'counter', 'chart', 'calendar', 'progress-bar', 'text'];
    if (!validWidgetTypes.includes(mapping.targetWidget)) {
      validation.errors.push(`Row ${index + 1}: Invalid widget type "${mapping.targetWidget}"`);
      validation.isValid = false;
    }

    // Check for duplicate source columns
    const duplicates = mappings.filter(m => m.sourceColumn === mapping.sourceColumn);
    if (duplicates.length > 1) {
      validation.warnings.push(`Column "${mapping.sourceColumn}" is mapped multiple times`);
    }
  });

  // Check if there's a date column for time-based widgets
  const timeBasedMappings = mappings.filter(m => 
    ['chart', 'counter', 'progress-bar'].includes(m.targetWidget)
  );
  
  if (timeBasedMappings.length > 0) {
    const hasDateColumn = mappings.some(m => m.targetWidget === 'calendar') ||
                         availableColumns.some(col => 
                           ['date', 'day', 'time'].some(keyword => 
                             col.toLowerCase().includes(keyword)
                           )
                         );
    
    if (!hasDateColumn) {
      validation.warnings.push('No date column detected. Time-based widgets may not work properly.');
    }
  }

  return validation;
};

export default {
  EnhancedCsvTransformService,
  applyCsvMappings,
  validateMappings
};
