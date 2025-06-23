import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HABIT_COLORS, HABIT_ICONS } from './types.js';

const useHabitStore = create(
  persist(
    (set, get) => ({      // State
      habits: new Map(),
      completions: new Map(),
      
      getCompletionsForDateRange: (startDate, endDate) => {
        const completions = Array.from(get().completions.values());
        return completions.filter(c => 
          c.date >= startDate && c.date <= endDate
        );
      },
      
      isHabitCompleted: (habitId, date) => {
        const completionId = `${date}_${habitId}`;
        return get().completions.has(completionId);
      },
      
      getHabitCompletions: (habitId) => {
        const completions = Array.from(get().completions.values());
        return completions.filter(c => c.habitId === habitId);
      },
      
      // Actions
      addHabit: (habitData) => {
        const habit = {
          id: Date.now(),
          createdAt: new Date(),
          color: HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)],
          icon: HABIT_ICONS[Math.floor(Math.random() * HABIT_ICONS.length)],
          ...habitData
        };
        
        set(state => ({
          habits: new Map(state.habits).set(habit.id, habit)
        }));
        
        return habit;
      },
      
      updateHabit: (habitId, updates) => {
        set(state => {
          const newHabits = new Map(state.habits);
          const existing = newHabits.get(habitId);
          if (existing) {
            newHabits.set(habitId, { ...existing, ...updates });
          }
          return { habits: newHabits };
        });
      },
      
      removeHabit: (habitId) => {
        set(state => {
          const newHabits = new Map(state.habits);
          newHabits.delete(habitId);
          
          // Clean up related completions
          const newCompletions = new Map(state.completions);
          for (const [key, completion] of newCompletions) {
            if (completion.habitId === habitId) {
              newCompletions.delete(key);
            }
          }
          
          return { habits: newHabits, completions: newCompletions };
        });
      },
      
      toggleCompletion: (habitId, date) => {
        const completionId = `${date}_${habitId}`;
        
        set(state => {
          const newCompletions = new Map(state.completions);
          
          if (newCompletions.has(completionId)) {
            newCompletions.delete(completionId);
          } else {
            newCompletions.set(completionId, {
              id: completionId,
              habitId,
              date,
              timestamp: new Date().toISOString()
            });
          }
          
          return { completions: newCompletions };
        });
      },
      
      bulkImportCompletions: (completionsArray) => {
        set(state => {
          const newCompletions = new Map(state.completions);
          
          completionsArray.forEach(completion => {
            newCompletions.set(completion.id, completion);
          });
          
          return { completions: newCompletions };
        });
      },
      
      clearAllData: () => {
        set({ habits: new Map(), completions: new Map() });
      }
    }),
    {
      name: 'bito-habits-v2', // Different name to avoid conflicts
      partialize: (state) => ({
        habits: Array.from(state.habits.entries()),
        completions: Array.from(state.completions.entries())
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.habits = new Map(state.habits || []);
          state.completions = new Map(state.completions || []);
        }
      }
    }
  )
);

export default useHabitStore;
