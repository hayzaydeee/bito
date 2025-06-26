/**
 * Server-Side LLM CSV Analyzer Service
 * Uses your backend API with centralized OpenAI key instead of client-side calls
 */

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Prepare CSV data for server analysis
 */
const prepareCsvSample = (csvData, maxRows = 5) => {
  const headers = csvData.meta.fields;
  const sampleRows = csvData.data.slice(0, maxRows);
  
  // Create column samples with type hints
  const columnAnalysis = {};
  headers.forEach(header => {
    const values = sampleRows.map(row => row[header]).filter(v => v !== null && v !== undefined && v !== '');
    
    columnAnalysis[header] = {
      sampleValues: values.slice(0, 3),
      totalValues: values.length,
      uniqueValues: [...new Set(values)].length,
      isEmpty: values.length === 0
    };
  });

  return {
    headers,
    totalRows: csvData.data.length,
    sampleRows: sampleRows.slice(0, 3), // Just first 3 rows for context
    columnAnalysis
  };
};

/**
 * Main server-side LLM analysis function
 */
export const analyzeCsvWithServerLLM = async (csvData, options = {}) => {
  try {
    // Prepare data for analysis (same as before but send to server)
    const csvSample = prepareCsvSample(csvData);
    
    // Send to your backend API instead of directly to OpenAI
    const response = await apiRequest('/csv/analyze', {
      method: 'POST',
      body: JSON.stringify({
        csvData: csvSample,
        options
      })
    });

    if (!response.success) {
      throw new Error(response.error || 'Server analysis failed');
    }

    return response.analysis;

  } catch (error) {
    console.error('Server LLM CSV analysis failed:', error);
    
    // Fallback to basic analysis if server fails
    return generateClientFallbackAnalysis(csvData, error.message);
  }
};

/**
 * Test server LLM configuration
 */
export const testServerLLMConnection = async () => {
  try {
    const response = await apiRequest('/csv/test', {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('Server LLM test failed:', error);
    return {
      success: false,
      configured: false,
      message: 'Failed to connect to server for LLM testing'
    };
  }
};

/**
 * Client-side fallback analysis when server is unavailable
 */
const generateClientFallbackAnalysis = (csvData, errorMessage) => {
  const headers = csvData.meta.fields;
  
  // Basic pattern matching fallback
  const suggestions = [];
  const dateColumn = headers.find(field => 
    /date|day|time|when/i.test(field)
  );
  
  headers.forEach(field => {
    if (field === dateColumn) return;
    
    const fieldLower = field.toLowerCase();
    let widgetType = 'text';
    let confidence = 0.3;
    let category = 'general';
    let icon = '✅';
    
    // Basic pattern recognition
    if (/exercise|workout|gym|run|walk/i.test(fieldLower)) {
      widgetType = 'habit-tracker';
      category = 'exercise';
      icon = '💪';
      confidence = 0.6;
    } else if (/read|book|study|learn/i.test(fieldLower)) {
      widgetType = 'habit-tracker';
      category = 'productivity';
      icon = '📚';
      confidence = 0.6;
    } else if (/meditat|sleep|rest|relax/i.test(fieldLower)) {
      widgetType = 'habit-tracker';
      category = 'wellness';
      icon = '🧘';
      confidence = 0.6;
    } else if (/steps|minutes|hours|count|number/i.test(fieldLower)) {
      widgetType = 'counter';
      confidence = 0.5;
    }
    
    suggestions.push({
      sourceColumn: field,
      widgetType,
      confidence,
      reasoning: `Client fallback analysis (Server error: ${errorMessage})`,
      config: {
        name: field,
        category,
        icon,
        color: '#6b7280'
      }
    });
  });
  
  return {
    confidence: 0.4,
    dateColumn,
    suggestions,
    patterns: {
      dataFormat: 'unknown',
      trackingStyle: 'mixed',
      timeRange: 'unknown',
      primaryUseCase: 'general_analytics'
    },
    recommendations: [
      'Server AI analysis failed. Using client-side pattern matching.',
      'Please check your internet connection and try again.',
      'Review and adjust mappings manually.'
    ],
    metadata: {
      source: 'client-fallback',
      error: errorMessage,
      timestamp: new Date().toISOString()
    }
  };
};

export default {
  analyzeCsvWithServerLLM,
  testServerLLMConnection
};
