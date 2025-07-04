/**
 * CSV Analysis API Route
 * Handles LLM-powered CSV analysis using server-side OpenAI API key
 */

const express = require("express");
const OpenAI = require("openai");
const rateLimit = require("express-rate-limit");
const router = express.Router();

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Your API key from environment variables
});

// Rate limiting: 10 requests per user per hour
const csvAnalysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour per IP/user
  message: {
    error: "Too many CSV analysis requests. Please try again later.",
    retryAfter: 3600, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// System prompt for ChatGPT (same as before)
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

// Context-specific prompts
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

  GENERAL: `You are analyzing a general CSV file for dashboard creation. Look for patterns that indicate how this data should be visualized and tracked.`,
};

/**
 * Select appropriate analysis prompt based on CSV content
 */
const selectAnalysisPrompt = (csvHeaders, sampleData) => {
  const headerText = csvHeaders.join(" ").toLowerCase();
  const sampleText = JSON.stringify(sampleData).toLowerCase();
  const combinedText = `${headerText} ${sampleText}`;

  if (/habit|routine|daily|streak|complete|done|practice/i.test(combinedText)) {
    return CSV_ANALYSIS_PROMPTS.HABIT_TRACKING;
  }

  if (
    /health|fitness|weight|steps|sleep|heart|calories|exercise|workout/i.test(
      combinedText
    )
  ) {
    return CSV_ANALYSIS_PROMPTS.HEALTH_DATA;
  }

  if (
    /task|project|work|productivity|focus|goal|deadline|priority/i.test(
      combinedText
    )
  ) {
    return CSV_ANALYSIS_PROMPTS.PRODUCTIVITY;
  }

  return CSV_ANALYSIS_PROMPTS.GENERAL;
};

/**
 * POST /api/csv/analyze
 * Analyze CSV structure and suggest widget mappings
 */
router.post("/analyze", csvAnalysisLimiter, async (req, res) => {
  try {
    const { csvData, useMock = false } = req.body;

    // Validate request
    if (!csvData || !csvData.headers || !csvData.sampleRows) {
      return res.status(400).json({
        error: "Invalid request. Expected csvData with headers and sampleRows.",
      });
    }

    // Validate CSV data size (prevent abuse)
    if (csvData.headers.length > 50) {
      return res.status(400).json({
        error: "Too many columns. Maximum 50 columns allowed.",
      });
    }

    if (csvData.sampleRows.length > 10) {
      return res.status(400).json({
        error: "Too many sample rows. Maximum 10 rows allowed.",
      });
    }

    // Check if we should use mock analysis (for testing when OpenAI is unavailable)
    if (useMock || process.env.USE_MOCK_LLM === 'true') {
      const mockAnalysis = generateMockAnalysis(csvData);
      return res.json({
        success: true,
        analysis: mockAnalysis,
        mode: 'mock'
      });
    }

    // Select appropriate prompt
    const contextPrompt = selectAnalysisPrompt(
      csvData.headers,
      csvData.sampleRows
    );

    // Build analysis prompt
    const userPrompt = `${contextPrompt}

Analyze this CSV structure:

Headers: ${csvData.headers.join(", ")}
Total rows: ${csvData.totalRows || "Unknown"}

Column details:
${Object.entries(csvData.columnAnalysis || {})
  .map(
    ([col, analysis]) =>
      `${col}: ${analysis.sampleValues?.join(", ") || "No samples"} (${
        analysis.totalValues || 0
      } values, ${analysis.uniqueValues || 0} unique)`
  )
  .join("\n")}

Sample rows:
${csvData.sampleRows
  .map((row, i) => `Row ${i + 1}: ${JSON.stringify(row)}`)
  .join("\n")}

Please provide comprehensive widget mapping suggestions for an optimal habit tracking dashboard.`; // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo", // Use gpt-3.5-turbo as default
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 2000,
      timeout: 30000,
    });

    if (
      !completion.choices ||
      !completion.choices[0] ||
      !completion.choices[0].message
    ) {
      throw new Error("Invalid response from OpenAI API");
    }

    // Parse response
    let analysis;
    try {
      analysis = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.error(
        "Failed to parse OpenAI response:",
        completion.choices[0].message.content
      );
      throw new Error("Failed to parse AI analysis response");
    }

    // Enhance analysis with metadata
    const enhancedAnalysis = {
      ...analysis,
      metadata: {
        headers: csvData.headers,
        totalRows: csvData.totalRows,
        source: "llm-server",
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        timestamp: new Date().toISOString(),
        tokensUsed: completion.usage?.total_tokens || 0,
      },
      suggestions: (analysis.suggestions || []).map((suggestion) => ({
        ...suggestion,
        confidence: Math.max(0, Math.min(1, suggestion.confidence || 0)),
        config: {
          name: suggestion.config?.name || suggestion.sourceColumn,
          category: suggestion.config?.category || "general",
          icon: suggestion.config?.icon || "✅",
          color: suggestion.config?.color || "#6b7280",
          ...suggestion.config,
        },
      })),
    };

    // Log usage for monitoring
    console.log(
      `CSV Analysis completed: ${
        completion.usage?.total_tokens || 0
      } tokens used`
    );

    res.json({
      success: true,
      analysis: enhancedAnalysis,
    });
  } catch (error) {
    console.error("CSV Analysis error:", error);

    // Handle specific OpenAI errors
    if (error.code === "insufficient_quota") {
      return res.status(429).json({
        error:
          "AI service temporarily unavailable due to quota limits. Please try again later.",
        fallback: true,
      });
    }

    if (error.code === "rate_limit_exceeded") {
      return res.status(429).json({
        error: "AI service is busy. Please try again in a moment.",
        fallback: true,
      });
    }

    // Generic error response
    res.status(500).json({
      error: "AI analysis failed. Using basic pattern matching instead.",
      fallback: true,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/csv-analysis/test
 * Test OpenAI API connection and configuration
 */
router.get("/test", async (req, res) => {
  try {
    // Test with a minimal request to check API key validity
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: [
        { role: "user", content: "Say 'API test successful' in exactly 3 words." }
      ],
      max_tokens: 10,
      temperature: 0
    });

    if (completion.choices && completion.choices[0]) {
      res.json({
        success: true,
        configured: true,
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        message: "OpenAI API is working correctly",
        response: completion.choices[0].message.content,
        tokensUsed: completion.usage?.total_tokens || 0
      });
    } else {
      throw new Error("Invalid response from OpenAI");
    }
  } catch (error) {
    console.error("OpenAI API test failed:", error);
    
    let errorMessage = "OpenAI API connection failed";
    let configured = !!process.env.OPENAI_API_KEY;
    
    if (error.code === "insufficient_quota") {
      errorMessage = "OpenAI API quota exceeded or billing issue";
    } else if (error.code === "invalid_api_key") {
      errorMessage = "Invalid OpenAI API key";
      configured = false;
    } else if (error.code === "rate_limit_exceeded") {
      errorMessage = "OpenAI API rate limit exceeded";
    }

    res.json({
      success: false,
      configured,
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

/**
 * Generate mock LLM analysis for testing purposes
 */
const generateMockAnalysis = (csvData) => {
  const headers = csvData.headers;
  const dateColumn = headers.find(header => 
    /date|day|time|when/i.test(header)
  );
  
  const suggestions = [];
  
  headers.forEach(header => {
    if (header === dateColumn) return;
    
    const headerLower = header.toLowerCase();
    let widgetType = 'habit-tracker';
    let confidence = 0.85;
    let category = 'general';
    let icon = '✅';
    let color = '#6b7280';
    
    // Smart pattern recognition for mock analysis
    if (/exercise|workout|gym|run|walk|fitness|sport/i.test(headerLower)) {
      widgetType = 'habit-tracker';
      category = 'exercise';
      icon = '💪';
      color = '#f59e0b';
      confidence = 0.92;
    } else if (/read|book|study|learn|education/i.test(headerLower)) {
      widgetType = 'habit-tracker';
      category = 'productivity';
      icon = '📚';
      color = '#3b82f6';
      confidence = 0.90;
    } else if (/meditat|sleep|rest|relax|wellness|health/i.test(headerLower)) {
      widgetType = 'habit-tracker';
      category = 'wellness';
      icon = '🧘';
      color = '#10b981';
      confidence = 0.88;
    } else if (/steps|minutes|hours|count|number|score|rating/i.test(headerLower)) {
      widgetType = 'counter';
      category = 'general';
      icon = '🔢';
      color = '#8b5cf6';
      confidence = 0.85;
    } else if (/social|friend|family|call|message|meet/i.test(headerLower)) {
      widgetType = 'habit-tracker';
      category = 'social';
      icon = '👥';
      color = '#ec4899';
      confidence = 0.80;
    } else if (/creative|art|write|music|draw|design/i.test(headerLower)) {
      widgetType = 'habit-tracker';
      category = 'creativity';
      icon = '🎨';
      color = '#f59e0b';
      confidence = 0.83;
    }
    
    suggestions.push({
      sourceColumn: header,
      widgetType,
      confidence,
      reasoning: `Mock AI analysis: Detected ${category} habit based on column name "${header}". Suggests ${widgetType} widget for optimal tracking.`,
      config: {
        name: header.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category,
        icon,
        color
      }
    });
  });
  
  return {
    confidence: 0.89,
    dateColumn,
    suggestions,
    patterns: {
      dataFormat: 'daily_habits',
      trackingStyle: 'mixed',
      timeRange: `${csvData.totalRows || 0} days`,
      primaryUseCase: 'habit_formation'
    },
    recommendations: [
      'Mock AI Analysis: This appears to be a habit tracking dataset.',
      'Date column detected for timeline visualization.',
      'Consider grouping related habits into categories.',
      'High confidence suggestions have been automatically applied.'
    ],
    metadata: {
      headers: csvData.headers,
      totalRows: csvData.totalRows,
      source: 'mock-llm',
      model: 'mock-gpt-3.5-turbo',
      timestamp: new Date().toISOString(),
      tokensUsed: 0
    }
  };
};

/**
 * GET /api/csv-analysis/usage
 * Get usage statistics (optional, for monitoring)
 */
router.get("/usage", async (req, res) => {
  // This could return usage statistics if you want to track API usage
  res.json({
    message: "Usage tracking not implemented yet",
  });
});

module.exports = router;
