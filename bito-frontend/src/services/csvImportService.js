/**
 * CSV Import Service
 * Handles importing habit data from CSV files
 */

import Papa from 'papaparse';

// Map CSV habit names to internal habit structure
const HABIT_MAPPING = {
  'pushups': { name: 'Pushups', color: '#f59e0b', icon: '💪' },
  'bible study': { name: 'Bible Study', color: '#8b5cf6', icon: '📖' },
  '7hrs of sleep': { name: '7+ Hours Sleep', color: '#3b82f6', icon: '😴' },
  'substack': { name: 'Substack Writing', color: '#10b981', icon: '✍️' },
  'learning': { name: 'Learning', color: '#6366f1', icon: '🧠' },
  'work': { name: 'Work', color: '#ef4444', icon: '💼' },
  '7k steps/day': { name: '7K+ Steps', color: '#f97316', icon: '🚶' },
  'album review': { name: 'Album Review', color: '#ec4899', icon: '🎵' },
  'review tiktoks/yt': { name: 'Review TikToks/YT', color: '#14b8a6', icon: '📱' },
  'screen time < 4hrs': { name: 'Screen Time < 4hrs', color: '#84cc16', icon: '⏰' }
};

// Parse date from CSV format "@May 1, 2025" to YYYY-MM-DD
const parseCsvDate = (csvDate) => {
  try {
    // Remove @ symbol and parse
    const cleanDate = csvDate.replace('@', '').trim();
    const date = new Date(cleanDate);
    
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${csvDate}`);
    }
    
    // Format as YYYY-MM-DD
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error parsing date:', csvDate, error);
    return null;
  }
};

// Convert Yes/No to boolean
const parseCompletion = (value) => {
  if (typeof value === 'string') {
    return value.toLowerCase().trim() === 'yes';
  }
  return Boolean(value);
};

// Main CSV import function
export const importCsvData = (csvText) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        try {
          const importResult = processCsvData(results.data);
          resolve(importResult);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
};

// Process parsed CSV data into habit tracker format
const processCsvData = (csvData) => {
  const habits = [];
  const completions = {};
  const errors = [];
  const stats = {
    totalRows: csvData.length,
    validRows: 0,
    duplicateDates: 0,
    invalidDates: 0,
    habitsFound: new Set()
  };

  // Create habits array from mapping
  let habitId = 1;
  const habitIdMap = {};
  
  Object.entries(HABIT_MAPPING).forEach(([csvName, habitData]) => {
    const habit = {
      id: habitId,
      name: habitData.name,
      color: habitData.color,
      icon: habitData.icon
    };
    habits.push(habit);
    habitIdMap[csvName] = habitId;
    habitId++;
  });

  // Track processed dates to detect duplicates
  const processedDates = new Set();

  // Process each row
  csvData.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because CSV is 1-indexed and has header
    
    // Parse date
    const dateStr = parseCsvDate(row.Day);
    if (!dateStr) {
      errors.push(`Row ${rowNumber}: Invalid date format "${row.Day}"`);
      stats.invalidDates++;
      return;
    }

    // Check for duplicate dates
    if (processedDates.has(dateStr)) {
      errors.push(`Row ${rowNumber}: Duplicate date "${dateStr}"`);
      stats.duplicateDates++;
      return;
    }
    processedDates.add(dateStr);

    // Process each habit column
    Object.entries(HABIT_MAPPING).forEach(([csvHabitName, habitData]) => {
      if (row.hasOwnProperty(csvHabitName)) {
        stats.habitsFound.add(csvHabitName);
        const habitId = habitIdMap[csvHabitName];
        const isCompleted = parseCompletion(row[csvHabitName]);
        
        if (isCompleted) {
          completions[`${dateStr}-${habitId}`] = true;
        }
      }
    });

    stats.validRows++;
  });

  // Calculate date range
  const dates = Array.from(processedDates).sort();
  const dateRange = {
    start: dates[0],
    end: dates[dates.length - 1],
    totalDays: dates.length
  };

  return {
    habits,
    completions,
    stats: {
      ...stats,
      habitsFound: Array.from(stats.habitsFound),
      dateRange
    },
    errors
  };
};

// Merge imported data with existing data
export const mergeWithExistingData = (importedData, existingHabits = [], existingCompletions = {}) => {
  const mergedHabits = [...existingHabits];
  const mergedCompletions = { ...existingCompletions };
  
  // Add new habits (avoid duplicates by name)
  const existingHabitNames = new Set(existingHabits.map(h => h.name.toLowerCase()));
  
  importedData.habits.forEach(importedHabit => {
    if (!existingHabitNames.has(importedHabit.name.toLowerCase())) {
      // Assign new ID to avoid conflicts
      const newId = Math.max(0, ...mergedHabits.map(h => h.id)) + 1;
      mergedHabits.push({
        ...importedHabit,
        id: newId
      });
    }
  });
  
  // Add completions (imported data takes precedence for conflicts)
  Object.assign(mergedCompletions, importedData.completions);
  
  return {
    habits: mergedHabits,
    completions: mergedCompletions
  };
};

// Validate CSV structure before import
export const validateCsvStructure = (csvText) => {
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      header: true,
      preview: 5, // Only parse first 5 rows for validation
      complete: (results) => {
        const headers = results.meta.fields || [];
        const validation = {
          isValid: true,
          errors: [],
          warnings: [],
          detectedHabits: [],
          sampleData: results.data[0] || {}
        };

        // Check required columns
        if (!headers.includes('Day')) {
          validation.isValid = false;
          validation.errors.push('Missing required "Day" column');
        }

        // Check for recognized habit columns
        const recognizedHabits = headers.filter(header => 
          Object.keys(HABIT_MAPPING).includes(header.toLowerCase().trim())
        );
        
        validation.detectedHabits = recognizedHabits;
        
        if (recognizedHabits.length === 0) {
          validation.warnings.push('No recognized habit columns found');
        }

        // Check date format in first row
        if (results.data.length > 0 && results.data[0].Day) {
          const testDate = parseCsvDate(results.data[0].Day);
          if (!testDate) {
            validation.errors.push(`Invalid date format in first row: "${results.data[0].Day}"`);
            validation.isValid = false;
          }
        }

        resolve(validation);
      }
    });
  });
};

export default {
  importCsvData,
  mergeWithExistingData,
  validateCsvStructure,
  HABIT_MAPPING
};
