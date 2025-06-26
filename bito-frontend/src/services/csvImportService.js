/**
 * Flexible CSV Import Service
 * Handles importing habit data from any CSV format
 * Integrates with MongoDB backend via HabitContext
 */

import Papa from 'papaparse';

// Helper function to parse various date formats
const parseCsvDate = (csvDate) => {
  try {
    // Handle various date formats
    let cleanDate = csvDate;
    
    // Remove @ symbol if present
    if (typeof cleanDate === 'string') {
      cleanDate = cleanDate.replace('@', '').trim();
    }
    
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

// Helper function to parse completion values (Yes/No, 1/0, true/false, etc.)
const parseCompletion = (value) => {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'number') {
    return value > 0;
  }
  
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    return normalized === 'yes' || 
           normalized === 'true' || 
           normalized === '1' || 
           normalized === 'y' ||
           normalized === 'completed' ||
           normalized === 'done';
  }
  
  return Boolean(value);
};

// Helper function to generate colors for habits
const generateHabitColor = (index) => {
  const colors = [
    'var(--color-brand-400)',
    'var(--color-success)', 
    'var(--color-warning)',
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#3b82f6', // blue
    '#10b981', // emerald
    '#6366f1', // indigo
    '#ef4444', // red
    '#f97316', // orange
    '#ec4899', // pink
    '#14b8a6', // teal
    '#84cc16', // lime
    '#6b7280', // gray
    '#7c3aed', // violet
  ];
  return colors[index % colors.length];
};

// Helper function to generate icons for habits
const generateHabitIcon = (index, habitName) => {
  // Try to match icon based on habit name
  const name = habitName.toLowerCase();
  
  if (name.includes('exercise') || name.includes('workout') || name.includes('gym') || name.includes('pushup')) return '💪';
  if (name.includes('read') || name.includes('book') || name.includes('study')) return '📖';
  if (name.includes('sleep') || name.includes('rest')) return '😴';
  if (name.includes('write') || name.includes('blog') || name.includes('journal')) return '✍️';
  if (name.includes('learn') || name.includes('course')) return '🧠';
  if (name.includes('work') || name.includes('job')) return '💼';
  if (name.includes('walk') || name.includes('step') || name.includes('run')) return '🚶';
  if (name.includes('music') || name.includes('song') || name.includes('album')) return '🎵';
  if (name.includes('meditat') || name.includes('mindful')) return '🧘';
  if (name.includes('water') || name.includes('drink')) return '💧';
  if (name.includes('vitamin') || name.includes('supplement')) return '💊';
  if (name.includes('clean') || name.includes('tidy')) return '🧹';
  if (name.includes('code') || name.includes('program')) return '💻';
  if (name.includes('prayer') || name.includes('spiritual')) return '🙏';
  
  // Default icons if no match
  const defaultIcons = ['✅', '🎯', '🔥', '💎', '⭐', '🌟', '✨', '🚀', '💫', '🎨', '🎪', '🎭', '🎮', '🎲'];
  return defaultIcons[index % defaultIcons.length];
};

// Flexible CSV parser that works with any format
const parseFlexibleCsv = (csvData) => {
  console.log('📊 Parsing flexible CSV data:', csvData.length, 'rows');
  
  if (!csvData || csvData.length === 0) {
    throw new Error('CSV file is empty or invalid');
  }
  
  // Get first row to determine columns
  const firstRow = csvData[0];
  const columns = Object.keys(firstRow);
  
  console.log('📋 Detected columns:', columns);
  
  // Identify date column (flexible matching)
  const dateColumn = columns.find(col => 
    /^(date|day|time|when)$/i.test(col.trim())
  );
  
  if (!dateColumn) {
    throw new Error('No date column found. Please ensure your CSV has a column named "Date", "Day", or "Time"');
  }
  
  console.log('📅 Using date column:', dateColumn);
  
  // All other non-empty columns are potential habits
  const habitColumns = columns.filter(col => 
    col !== dateColumn && 
    col.trim() !== '' &&
    !col.startsWith('_') && // Ignore metadata columns
    !col.toLowerCase().includes('note') && // Ignore notes columns
    !col.toLowerCase().includes('comment') // Ignore comment columns
  );
  
  console.log('🎯 Detected habit columns:', habitColumns);
  
  if (habitColumns.length === 0) {
    throw new Error('No habit columns found. Please ensure your CSV has columns for habits besides the date column.');
  }
  
  // Generate dynamic habit definitions
  const habits = habitColumns.map((habitName, index) => ({
    name: habitName.trim(),
    color: generateHabitColor(index),
    icon: generateHabitIcon(index, habitName),
    description: `Imported from CSV`
  }));
  
  // Process entries for each date
  const entries = [];
  const processedDates = new Set();
  const errors = [];
  
  csvData.forEach((row, index) => {
    const rowNumber = index + 1;
    
    // Parse date
    const dateStr = parseCsvDate(row[dateColumn]);
    if (!dateStr) {
      errors.push(`Row ${rowNumber}: Invalid date format "${row[dateColumn]}"`);
      return;
    }
    
    // Check for duplicate dates
    if (processedDates.has(dateStr)) {
      errors.push(`Row ${rowNumber}: Duplicate date "${dateStr}"`);
      return;
    }
    processedDates.add(dateStr);
    
    // Process each habit for this date
    habitColumns.forEach((habitName, habitIndex) => {
      const value = row[habitName];
      const isCompleted = parseCompletion(value);
      
      if (isCompleted) {
        entries.push({
          habitName: habitName.trim(),
          habitIndex,
          date: dateStr,
          completed: true
        });
      }
    });
  });
  
  // Calculate statistics
  const stats = {
    totalRows: csvData.length,
    validRows: processedDates.size,
    habitsFound: habitColumns.length,
    totalEntries: entries.length,
    dateRange: processedDates.size > 0 ? {
      start: Math.min(...Array.from(processedDates)),
      end: Math.max(...Array.from(processedDates)),
      totalDays: processedDates.size
    } : null,
    errors
  };
  
  console.log('📈 Import statistics:', stats);
  
  return {
    habits,
    entries,
    stats,
    errors
  };
};

// Validate CSV structure
export const validateCsvStructure = async (csvText) => {
  try {
    const result = await new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: resolve,
        error: reject
      });
    });
    
    if (result.errors.length > 0) {
      return {
        isValid: false,
        errors: result.errors.map(err => err.message)
      };
    }
    
    if (!result.data || result.data.length === 0) {
      return {
        isValid: false,
        errors: ['CSV file is empty']
      };
    }
    
    // Try to parse and validate
    try {
      const parsed = parseFlexibleCsv(result.data);
      return {
        isValid: true,
        preview: {
          totalRows: parsed.stats.totalRows,
          habitsFound: parsed.stats.habitsFound,
          habits: parsed.habits.map(h => h.name),
          dateRange: parsed.stats.dateRange
        }
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message]
      };
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to parse CSV: ${error.message}`]
    };
  }
};

// Main import function
export const importCsvData = async (csvText) => {
  try {
    const result = await new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: resolve,
        error: reject
      });
    });
    
    if (result.errors.length > 0) {
      throw new Error(`CSV parsing error: ${result.errors[0].message}`);
    }
    
    return parseFlexibleCsv(result.data);
  } catch (error) {
    console.error('CSV import error:', error);
    throw error;
  }
};

// Execute import with backend integration
export const executeImportWithBackend = async (csvData, habitContext) => {
  console.log('🚀 Starting backend import process...');
  
  const { addHabit, toggleHabitEntry } = habitContext;
  const results = {
    habitsCreated: 0,
    entriesCreated: 0,
    errors: [],
    createdHabits: []
  };
  
  try {
    // Step 1: Create all habits in the backend
    console.log('📝 Creating habits in backend...');
    const habitMap = new Map(); // Map original name to created habit
    
    for (const habitData of csvData.habits) {
      try {
        console.log(`Creating habit: ${habitData.name}`);
        const createdHabit = await addHabit(habitData);
        
        habitMap.set(habitData.name, createdHabit);
        results.habitsCreated++;
        results.createdHabits.push(createdHabit);
        
        console.log(`✅ Created habit: ${createdHabit.name} (ID: ${createdHabit._id})`);
      } catch (error) {
        console.error(`❌ Failed to create habit ${habitData.name}:`, error);
        results.errors.push(`Failed to create habit "${habitData.name}": ${error.message}`);
      }
    }
    
    // Step 2: Create all entries in the backend
    console.log('📅 Creating habit entries in backend...');
    
    for (const entry of csvData.entries) {
      try {
        const habit = habitMap.get(entry.habitName);
        if (!habit) {
          results.errors.push(`Habit "${entry.habitName}" not found for entry on ${entry.date}`);
          continue;
        }
        
        console.log(`Creating entry: ${habit.name} on ${entry.date}`);
        await toggleHabitEntry(habit._id, entry.date);
        results.entriesCreated++;
        
      } catch (error) {
        console.error(`❌ Failed to create entry for ${entry.habitName} on ${entry.date}:`, error);
        results.errors.push(`Failed to create entry for "${entry.habitName}" on ${entry.date}: ${error.message}`);
      }
    }
    
    console.log('✅ Backend import completed:', results);
    return results;
    
  } catch (error) {
    console.error('💥 Fatal error during backend import:', error);
    throw new Error(`Import failed: ${error.message}`);
  }
};

// Legacy compatibility functions (kept for backward compatibility)
export const mergeWithExistingData = () => {
  console.warn('⚠️  mergeWithExistingData is deprecated. Use executeImportWithBackend instead.');
  return { merged: true };
};

export const mergeWithNewStore = () => {
  console.warn('⚠️  mergeWithNewStore is deprecated. Use executeImportWithBackend instead.');
  return { merged: true };
};

// Default export
const csvImportService = {
  importCsvData,
  validateCsvStructure,
  executeImportWithBackend,
  mergeWithExistingData, // Legacy
  mergeWithNewStore     // Legacy
};

export default csvImportService;
