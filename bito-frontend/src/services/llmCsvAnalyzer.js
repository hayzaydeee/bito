/**
 * LLM-Powered CSV Analyzer Service (Server-Side)
 * Uses your backend API with centralized OpenAI key for intelligent CSV analysis
 */

import { API_BASE_URL } from './api';

/**
 * Prepare CSV data for backend analysis
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
 * Main LLM analysis function using backend API
 */
export const analyzeCsvWithLLM = async (csvData, options = {}) => {
  const { timeout = 30000 } = options;

  try {
    // Prepare data for analysis
    const csvSample = prepareCsvSample(csvData);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${API_BASE_URL}/api/csv-analysis/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include session cookies for authentication
      body: JSON.stringify({
        csvData: csvSample
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(result.error || 'Rate limit exceeded. Please try again later.');
      } else if (response.status === 400) {
        throw new Error(result.error || 'Invalid CSV data format.');
      } else if (result.fallback) {
        // Server suggests fallback - this is expected for some errors
        throw new Error(result.error || 'AI analysis unavailable, using basic analysis.');
      } else {
        throw new Error(result.error || `Server error: ${response.status}`);
      }
    }

    if (!result.success || !result.analysis) {
      throw new Error('Invalid response from analysis service');
    }

    return result.analysis;

  } catch (error) {
    console.error('LLM CSV analysis failed:', error);
    
    // Return fallback analysis
    return generateFallbackAnalysis(csvData, error.message);
  }
};

/**
 * Fallback analysis when LLM is unavailable
 */
const generateFallbackAnalysis = (csvData, errorMessage) => {
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
      reasoning: `Basic pattern matching fallback (AI analysis failed: ${errorMessage})`,
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
      'AI analysis failed. Using basic pattern matching.',
      'Please try again later for better analysis.',
      'Review and adjust mappings manually.'
    ],
    metadata: {
      source: 'fallback',
      error: errorMessage,
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Check if AI analysis is available
 */
export const isAIAnalysisAvailable = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/csv-analysis/usage`, {
      method: 'GET',
      credentials: 'include'
    });
    return response.ok;
  } catch {
    return false;
  }
};

export default {
  analyzeCsvWithLLM,
  isAIAnalysisAvailable
};
