const express = require('express');
const router = express.Router();

// CSV Analysis Prompts
const CSV_ANALYSIS_PROMPTS = {
  HABIT_TRACKING: `You are analyzing a CSV for habit tracking. Look for:
- Date/time columns (when habits were tracked)
- Boolean completion columns (yes/no, done/incomplete, checkmarks)
- Numeric tracking (steps, minutes, reps, scores)
- Habit names or categories
- Notes or additional context

Focus on creating an intuitive dashboard that motivates habit formation.`,

  HEALTH_DATA: `You are analyzing health/fitness CSV data. Look for:
- Biometric measurements (weight, heart rate, blood pressure)
- Activity metrics (steps, calories, exercise duration)
- Sleep data (hours, quality scores)
- Nutrition tracking (calories, water intake)
- Health events or symptoms

Suggest widgets that help users understand health trends and patterns.`,

  PRODUCTIVITY: `You are analyzing productivity/work CSV data. Look for:
- Task completion tracking
- Time spent on activities
- Project categories or tags
- Goals and targets
- Performance metrics

Create widgets that help users optimize their productivity and work habits.`,

  GENERAL: `You are analyzing a general CSV file for dashboard creation. Look for patterns that indicate how this data should be visualized and tracked.`
};

// Main system prompt for ChatGPT
const SYSTEM_PROMPT = `You are a CSV analysis expert helping users map their data to dashboard widgets for habit tracking and productivity.

Available widget types:
- habit-tracker: Boolean habits (yes/no, done/not done) - shows streaks, completion rates
- counter: Numeric values (steps, minutes, reps) - shows totals, averages, trends  
- chart: Time-series data visualization - line/bar charts over time
- progress-bar: Percentage completion tracking
- calendar: Date-based visualization
- text: Notes, categories, or labels

Analyze the CSV structure and suggest the best widget mappings. Consider:
- Column names and their semantic meaning
- Data types and sample values
- Likely user intent for habit tracking
- Relationships between columns (dates, values, categories)
- How different widgets could work together

For each suggestion, provide:
- High confidence (0.8+) for obvious matches
- Medium confidence (0.5-0.7) for probable matches
- Low confidence (0.3-0.4) for possible matches
- Clear reasoning for each suggestion
- Appropriate configuration (name, category, icon, color)

Categories: exercise, wellness, productivity, social, creativity, general
Icons: Use relevant emojis (💪, 🧘, 📚, 👥, 🎨, ✅, etc.)
Colors: Use hex codes (#f59e0b, #3b82f6, #10b981, #ec4899, #8b5cf6, #6b7280)

Respond with JSON only:
{
  "confidence": 0.95,
  "dateColumn": "column_name_or_null",
  "suggestions": [
    {
      "sourceColumn": "column_name",
      "widgetType": "habit-tracker",
      "confidence": 0.9,
      "reasoning": "Clear explanation of why this mapping makes sense",
      "config": {
        "name": "Human-readable name",
        "category": "exercise|wellness|productivity|social|creativity|general",
        "icon": "💪",
        "color": "#f59e0b"
      }
    }
  ],
  "patterns": {
    "dataFormat": "daily_habits|weekly_summary|activity_log|health_metrics|productivity_tracker",
    "trackingStyle": "boolean|numeric|mixed|time_series",
    "timeRange": "estimated_days_of_data",
    "primaryUseCase": "habit_formation|health_monitoring|productivity_tracking|general_analytics"
  },
  "recommendations": [
    "Specific recommendations for dashboard layout or additional considerations"
  ]
}`;

/**
 * Select appropriate analysis prompt based on CSV content
 */
const selectAnalysisPrompt = (csvHeaders, sampleData) => {
  const headerText = csvHeaders.join(' ').toLowerCase();
  const sampleText = JSON.stringify(sampleData).toLowerCase();
  const combinedText = `${headerText} ${sampleText}`;
  
  if (/habit|routine|daily|streak|complete|done|practice/i.test(combinedText)) {
    return CSV_ANALYSIS_PROMPTS.HABIT_TRACKING;
  }
  
  if (/health|fitness|weight|steps|sleep|heart|calories|exercise|workout/i.test(combinedText)) {
    return CSV_ANALYSIS_PROMPTS.HEALTH_DATA;
  }
  
  if (/task|project|work|productivity|focus|goal|deadline|priority/i.test(combinedText)) {
    return CSV_ANALYSIS_PROMPTS.PRODUCTIVITY;
  }
  
  return CSV_ANALYSIS_PROMPTS.GENERAL;
};

/**
 * Generate fallback analysis when LLM is unavailable
 */
const generateFallbackAnalysis = (csvData, errorMessage) => {
  const headers = csvData.headers;
  
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
      'Please check server configuration.',
      'Review and adjust mappings manually.'
    ],
    metadata: {
      source: 'fallback',
      error: errorMessage,
      timestamp: new Date().toISOString()
    }
  };
};

// POST /api/csv/analyze - Analyze CSV structure with AI
router.post('/analyze', async (req, res) => {
  try {
    const { csvData, options = {} } = req.body;

    if (!csvData || !csvData.headers || !csvData.sampleRows) {
      return res.status(400).json({
        success: false,
        error: 'Invalid CSV data. Missing headers or sample rows.'
      });
    }

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OpenAI API key not configured, using fallback analysis');
      const fallbackResult = generateFallbackAnalysis(csvData, 'Server API key not configured');
      return res.json({
        success: true,
        analysis: fallbackResult
      });
    }

    const {
      model = 'gpt-4',
      maxTokens = 2000,
      temperature = 0.1,
      timeout = 30000
    } = options;

    // Prepare context prompt
    const contextPrompt = selectAnalysisPrompt(csvData.headers, csvData.sampleRows);
    
    const userPrompt = `${contextPrompt}

Analyze this CSV structure:

Headers: ${csvData.headers.join(', ')}
Total rows: ${csvData.totalRows || 'unknown'}

Column details:
${csvData.columnAnalysis ? Object.entries(csvData.columnAnalysis).map(([col, analysis]) => 
  `${col}: ${analysis.sampleValues?.join(', ') || 'no samples'} (${analysis.totalValues || 0} values, ${analysis.uniqueValues || 0} unique)`
).join('\n') : 'No column analysis provided'}

Sample rows:
${csvData.sampleRows.map((row, i) => `Row ${i + 1}: ${JSON.stringify(row)}`).join('\n')}

Please provide comprehensive widget mapping suggestions for an optimal habit tracking dashboard.`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature,
          max_tokens: maxTokens
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `OpenAI API error: ${response.status}`;
        if (response.status === 401) {
          errorMessage = 'Invalid OpenAI API key configured on server';
        } else if (response.status === 429) {
          errorMessage = 'OpenAI rate limit exceeded. Please try again later.';
        }
        
        console.error('OpenAI API error:', errorMessage);
        const fallbackResult = generateFallbackAnalysis(csvData, errorMessage);
        return res.json({
          success: true,
          analysis: fallbackResult
        });
      }

      const result = await response.json();
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error('Invalid response from OpenAI API');
      }

      let analysis;
      try {
        analysis = JSON.parse(result.choices[0].message.content);
      } catch (parseError) {
        console.error('Failed to parse LLM response:', result.choices[0].message.content);
        const fallbackResult = generateFallbackAnalysis(csvData, 'Failed to parse AI response');
        return res.json({
          success: true,
          analysis: fallbackResult
        });
      }
      
      // Enhance analysis with metadata
      const enhancedAnalysis = {
        ...analysis,
        metadata: {
          headers: csvData.headers,
          totalRows: csvData.totalRows,
          source: 'llm',
          model,
          timestamp: new Date().toISOString(),
          tokensUsed: result.usage?.total_tokens || 0
        },
        suggestions: (analysis.suggestions || []).map(suggestion => ({
          ...suggestion,
          confidence: Math.max(0, Math.min(1, suggestion.confidence || 0)),
          config: {
            name: suggestion.config?.name || suggestion.sourceColumn,
            category: suggestion.config?.category || 'general',
            icon: suggestion.config?.icon || '✅',
            color: suggestion.config?.color || '#6b7280',
            ...suggestion.config
          }
        }))
      };

      res.json({
        success: true,
        analysis: enhancedAnalysis
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('OpenAI request failed:', fetchError);
      
      let errorMessage = 'Network error connecting to OpenAI';
      if (fetchError.name === 'AbortError') {
        errorMessage = 'Request timeout - OpenAI took too long to respond';
      }
      
      const fallbackResult = generateFallbackAnalysis(csvData, errorMessage);
      res.json({
        success: true,
        analysis: fallbackResult
      });
    }

  } catch (error) {
    console.error('CSV analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during CSV analysis'
    });
  }
});

// GET /api/csv/test - Test OpenAI connection
router.get('/test', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.json({
        success: false,
        configured: false,
        message: 'OpenAI API key not configured on server'
      });
    }

    // Test with minimal request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      })
    });

    if (response.ok) {
      res.json({
        success: true,
        configured: true,
        message: 'OpenAI API key is working correctly'
      });
    } else {
      res.json({
        success: false,
        configured: true,
        message: `OpenAI API error: ${response.status}`
      });
    }

  } catch (error) {
    console.error('OpenAI test error:', error);
    res.json({
      success: false,
      configured: false,
      message: 'Failed to test OpenAI connection'
    });
  }
});

module.exports = router;
