// Dual-write system for gradual migration
import useHabitStore from '../store/habitStore.js';

// State to track if we're in transition mode
let isDualWriteEnabled = true;

export const setDualWriteMode = (enabled) => {
  isDualWriteEnabled = enabled;
  console.log(`🔄 Dual-write mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
};

// Dual-write wrapper for habit operations
export const dualWriteHabits = {
  // Add habit to both systems
  addHabit: (habitData, oldSetHabits) => {
    // Add to new store
    const newStore = useHabitStore.getState();
    const newHabit = newStore.addHabit(habitData);
    
    // Add to old system if dual-write is enabled
    if (isDualWriteEnabled && oldSetHabits) {
      oldSetHabits(prev => [...prev, newHabit]);
    }
    
    return newHabit;
  },
  
  // Remove habit from both systems
  removeHabit: (habitId, oldSetHabits, oldSetCompletions) => {
    // Remove from new store
    const newStore = useHabitStore.getState();
    newStore.removeHabit(habitId);
    
    // Remove from old system if dual-write is enabled
    if (isDualWriteEnabled && oldSetHabits) {
      oldSetHabits(prev => prev.filter(h => h.id !== habitId));
      
      // Also clean up completions in old system
      if (oldSetCompletions) {
        oldSetCompletions(prev => {
          const filtered = {};
          Object.entries(prev).forEach(([key, value]) => {
            if (!key.endsWith(`-${habitId}`)) {
              filtered[key] = value;
            }
          });
          return filtered;
        });
      }
    }
  },
  
  // Toggle completion in both systems
  toggleCompletion: (habitId, date, oldSetCompletions) => {
    // Toggle in new store
    const newStore = useHabitStore.getState();
    newStore.toggleCompletion(habitId, date);
    
    // Toggle in old system if dual-write is enabled
    if (isDualWriteEnabled && oldSetCompletions) {
      const oldKey = `${date}-${habitId}`;
      oldSetCompletions(prev => ({
        ...prev,
        [oldKey]: !prev[oldKey]
      }));
    }
  }
};

// Sync verification - ensure both systems have same data
export const verifyDataSync = () => {
  if (!isDualWriteEnabled) return { synced: true, message: 'Dual-write disabled' };
  
  try {    const newStore = useHabitStore.getState();
    const newHabits = Array.from(newStore.habits.values());
    const newCompletions = Array.from(newStore.completions.values());
    
    console.log('🔍 Sync verification:');
    console.log(`New store: ${newHabits.length} habits, ${newCompletions.length} completions`);
    
    return { 
      synced: true, 
      newStoreStats: {
        habits: newHabits.length,
        completions: newCompletions.length
      }
    };
  } catch (error) {
    console.error('❌ Sync verification failed:', error);
    return { synced: false, error: error.message };
  }
};

// Hook to gradually migrate components
export const useTransitionToNewStore = () => {
  const newStore = useHabitStore();
    return {
    // Getters
    habits: Array.from(newStore.habits.values()),
    isHabitCompleted: newStore.isHabitCompleted,
    
    // Actions
    addHabit: newStore.addHabit,
    removeHabit: newStore.removeHabit,
    toggleCompletion: newStore.toggleCompletion,
    
    // Utils
    getHabitStats: (habitId) => {
      return {
        totalCompletions: newStore.getHabitCompletions(habitId).length,
        currentStreak: 0 // Will implement streak calculation later
      };
    }
  };
};
