import { habitUtils } from '../contexts/HabitContext.jsx';
import useHabitStore from '../store/habitStore.js';

export const migrateExistingData = (oldHabits = [], oldCompletions = {}) => {
  console.log('🔄 Starting data migration...');
  
  const migratedHabits = new Map();
  const migratedCompletions = new Map();
  const migrationLog = {
    habitsProcessed: 0,
    completionsProcessed: 0,
    completionsSkipped: 0,
    errors: []
  };

  // Migrate habits
  oldHabits.forEach(habit => {
    try {
      migratedHabits.set(habit.id, {
        ...habit,
        createdAt: habit.createdAt || new Date(),
        // Ensure required fields exist
        color: habit.color || '#6366f1',
        icon: habit.icon || '✨'
      });
      migrationLog.habitsProcessed++;
    } catch (error) {
      migrationLog.errors.push(`Habit ${habit.id}: ${error.message}`);
    }
  });

  // Migrate completions - ONLY keep date-based keys
  Object.entries(oldCompletions).forEach(([key, value]) => {
    try {
      if (!value) {
        migrationLog.completionsSkipped++;
        return; // Skip false/null values
      }

      // Extract habit ID and date from key
      const parts = key.split('-');
      const habitId = parseInt(parts[parts.length - 1]);

      if (isNaN(habitId)) {
        migrationLog.completionsSkipped++;
        return;
      }

      // Check if it's already a date-based key (YYYY-MM-DD-habitId)
      const keyWithoutId = parts.slice(0, -1).join('-');
      if (/^\d{4}-\d{2}-\d{2}$/.test(keyWithoutId)) {
        // Convert to new format: YYYY-MM-DD_habitId
        const completionId = `${keyWithoutId}_${habitId}`;
        
        migratedCompletions.set(completionId, {
          id: completionId,
          habitId,
          date: keyWithoutId,
          timestamp: new Date().toISOString()
        });
        migrationLog.completionsProcessed++;
      } else {
        // Skip day-based keys
        migrationLog.completionsSkipped++;
      }
    } catch (error) {
      migrationLog.errors.push(`Completion ${key}: ${error.message}`);
      migrationLog.completionsSkipped++;
    }
  });

  console.log('📊 Migration Results:', migrationLog);
  
  return {
    habits: migratedHabits,
    completions: migratedCompletions,
    migrationLog
  };
};

// NEW: Auto-migration function
export const autoMigrateFromLocalStorage = () => {
  console.log('🔍 Checking for existing data to migrate...');
  
  try {
    // Check old storage format
    const oldHabitStore = localStorage.getItem('bito-habits');
    if (oldHabitStore) {
      const parsed = JSON.parse(oldHabitStore);
      const oldHabits = parsed.state?.habits || [];
      const oldCompletions = parsed.state?.completions || {};
      
      if (oldHabits.length > 0 || Object.keys(oldCompletions).length > 0) {
        console.log('📦 Found existing data, migrating...');
        
        const migrated = migrateExistingData(oldHabits, oldCompletions);
        
        // Populate new store
        const store = useHabitStore.getState();
        
        // Clear existing data first
        store.clearAllData();
        
        // Add migrated habits
        migrated.habits.forEach(habit => {
          store.addHabit(habit);
        });
        
        // Add migrated completions
        const completionsArray = Array.from(migrated.completions.values());
        store.bulkImportCompletions(completionsArray);
        
        console.log('✅ Migration complete!');
        return migrated.migrationLog;
      }
    }
    
    console.log('ℹ️ No existing data found to migrate');
    return null;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { error: error.message };
  }
};

// Test the migration with existing data
export const testMigration = () => {
  console.log('🧪 Testing data migration...');
  
  const sampleOldData = {
    habits: [
      { id: 1, name: 'Exercise', color: '#f59e0b', icon: '💪' },
      { id: 2, name: 'Reading', color: '#8b5cf6', icon: '📖' }
    ],
    completions: {
      '2024-01-15-1': true,
      '2024-01-15-2': true,
      'Monday-1': true, // This should be ignored
      '2024-01-16-1': true
    }
  };
  
  const migrated = migrateExistingData(sampleOldData.habits, sampleOldData.completions);
  
  console.log('Migrated habits:', Array.from(migrated.habits.values()));
  console.log('Migrated completions:', Array.from(migrated.completions.values()));
  
  return migrated;
};
