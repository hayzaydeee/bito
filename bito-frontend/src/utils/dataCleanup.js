// Data cleanup script for browser console
// Run this in your browser's dev console to clean up the dual-key data

(() => {
  console.log('🧹 Bito Data Cleanup Script');
  console.log('============================');
  
  // Get current localStorage data
  const habitStorageKey = 'bito-habits';
  const existingData = localStorage.getItem(habitStorageKey);
  
  if (!existingData) {
    console.log('✅ No existing data found - fresh start!');
    return;
  }
  
  try {
    const parsed = JSON.parse(existingData);
    const state = parsed.state || {};
    const completions = state.completions || {};
    
    console.log('📊 Current data analysis:');
    console.log('Habits:', (state.habits || []).length);
    console.log('Total completion keys:', Object.keys(completions).length);
    
    // Analyze key types
    const allKeys = Object.keys(completions);
    const dateBasedKeys = allKeys.filter(key => /^\d{4}-\d{2}-\d{2}-\d+$/.test(key));
    const dayBasedKeys = allKeys.filter(key => /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)-\d+$/.test(key));
    const otherKeys = allKeys.filter(key => 
      !dateBasedKeys.includes(key) && !dayBasedKeys.includes(key)
    );
    
    console.log('  Date-based keys (YYYY-MM-DD-id):', dateBasedKeys.length);
    console.log('  Day-based keys (Monday-id):', dayBasedKeys.length);
    console.log('  Other keys:', otherKeys.length);
    
    // Create cleaned completions (keep only date-based keys)
    const cleanedCompletions = {};
    dateBasedKeys.forEach(key => {
      if (completions[key]) {
        cleanedCompletions[key] = completions[key];
      }
    });
    
    console.log('🧹 Cleaning up data...');
    console.log('Keeping', Object.keys(cleanedCompletions).length, 'date-based completion keys');
    console.log('Removing', dayBasedKeys.length + otherKeys.length, 'problematic keys');
    
    // Update localStorage with cleaned data
    const cleanedState = {
      ...state,
      completions: cleanedCompletions
    };
    
    const cleanedData = {
      ...parsed,
      state: cleanedState
    };
    
    localStorage.setItem(habitStorageKey, JSON.stringify(cleanedData));
    
    console.log('✅ Data cleanup complete!');
    console.log('💡 Refresh the page to see the effects');
    
    return {
      before: {
        totalKeys: allKeys.length,
        dateBasedKeys: dateBasedKeys.length,
        dayBasedKeys: dayBasedKeys.length,
        otherKeys: otherKeys.length
      },
      after: {
        totalKeys: Object.keys(cleanedCompletions).length,
        dateBasedKeys: Object.keys(cleanedCompletions).length,
        dayBasedKeys: 0,
        otherKeys: 0
      }
    };
    
  } catch (error) {
    console.error('❌ Error cleaning data:', error);
    console.log('📝 Manual cleanup may be required');
    return null;
  }
})();
