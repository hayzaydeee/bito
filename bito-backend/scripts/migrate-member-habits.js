const mongoose = require('mongoose');
const Habit = require('../models/Habit');
const MemberHabit = require('../models/MemberHabit');
const WorkspaceHabit = require('../models/WorkspaceHabit');
const HabitEntry = require('../models/HabitEntry');

/**
 * Migration script to convert MemberHabit entries to Habit entries
 * This enables the unified habit system for workspace accountability
 */
async function migrateMemberHabitsToHabits() {
  try {
    console.log('🔄 Starting MemberHabit to Habit migration...');
    
    // Get all active member habits
    const memberHabits = await MemberHabit.find({ isActive: true })
      .populate('workspaceHabitId')
      .populate('userId', 'name email');
    
    console.log(`📊 Found ${memberHabits.length} member habits to migrate`);
    
    let migrated = 0;
    let errors = 0;
    
    for (const memberHabit of memberHabits) {
      try {
        // Skip if workspace habit doesn't exist
        if (!memberHabit.workspaceHabitId) {
          console.log(`⚠️  Skipping member habit ${memberHabit._id} - no workspace habit reference`);
          continue;
        }
        
        const workspaceHabit = memberHabit.workspaceHabitId;
        
        // Check if habit already exists (prevent duplicates)
        const existingHabit = await Habit.findOne({
          userId: memberHabit.userId._id,
          workspaceId: memberHabit.workspaceId,
          workspaceHabitId: memberHabit.workspaceHabitId._id,
          source: 'workspace'
        });
        
        if (existingHabit) {
          console.log(`ℹ️  Habit already exists for user ${memberHabit.userId.name} - ${workspaceHabit.name}`);
          continue;
        }
        
        // Create new Habit entry from MemberHabit
        const newHabit = new Habit({
          // Basic habit info from workspace habit
          name: memberHabit.personalSettings?.customName || workspaceHabit.name,
          description: workspaceHabit.description,
          category: workspaceHabit.category,
          color: workspaceHabit.color,
          icon: workspaceHabit.icon,
          
          // User and workspace references
          userId: memberHabit.userId._id,
          source: 'workspace',
          workspaceId: memberHabit.workspaceId,
          workspaceHabitId: memberHabit.workspaceHabitId._id,
          adoptedAt: memberHabit.adoptedAt,
          
          // Tracking settings from personal settings or workspace defaults
          frequency: workspaceHabit.defaultSettings?.frequency || 'daily',
          target: {
            value: memberHabit.personalSettings?.target?.value || workspaceHabit.defaultSettings?.target?.value || 1,
            unit: memberHabit.personalSettings?.target?.unit || workspaceHabit.defaultSettings?.target?.unit || 'times',
            customUnit: memberHabit.personalSettings?.target?.customUnit || workspaceHabit.defaultSettings?.target?.customUnit
          },
          
          // Schedule settings
          schedule: {
            days: memberHabit.personalSettings?.schedule?.days || workspaceHabit.defaultSettings?.schedule?.days || [0, 1, 2, 3, 4, 5, 6],
            reminderTime: memberHabit.personalSettings?.schedule?.reminderTime || workspaceHabit.defaultSettings?.schedule?.reminderTime,
            reminderEnabled: memberHabit.personalSettings?.schedule?.reminderEnabled || false
          },
          
          // Workspace settings
          workspaceSettings: {
            shareProgress: memberHabit.personalSettings?.shareProgress || 'progress-only',
            allowInteraction: false, // Default to false for security
            shareInActivity: memberHabit.personalSettings?.shareInActivity !== false // Default to true unless explicitly false
          },
          
          // Status
          isActive: memberHabit.isActive,
          isArchived: false,
          
          // Stats from member habit
          stats: {
            totalChecks: memberHabit.totalCompletions || 0,
            currentStreak: memberHabit.currentStreak || 0,
            longestStreak: memberHabit.longestStreak || 0,
            lastChecked: memberHabit.lastCompletedAt,
            completionRate: 0 // Will be recalculated
          },
          
          // Timestamps
          createdAt: memberHabit.adoptedAt || memberHabit.createdAt,
          updatedAt: memberHabit.updatedAt
        });
        
        await newHabit.save();
        
        // Update any existing habit entries to reference the new habit
        await HabitEntry.updateMany(
          { 
            habitId: memberHabit._id,
            habitType: 'MemberHabit' // If this field exists
          },
          { 
            habitId: newHabit._id,
            $unset: { habitType: "" } // Remove the type field if it exists
          }
        );
        
        migrated++;
        console.log(`✅ Migrated: ${memberHabit.userId.name} - ${workspaceHabit.name}`);
        
      } catch (error) {
        errors++;
        console.error(`❌ Error migrating member habit ${memberHabit._id}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully migrated: ${migrated} habits`);
    console.log(`❌ Errors: ${errors} habits`);
    
    if (errors === 0) {
      console.log(`\n⚠️  Next steps:`);
      console.log(`1. Verify the migration by checking the new habits`);
      console.log(`2. Update API endpoints to use the new Habit model`);
      console.log(`3. Test the frontend with the new unified system`);
      console.log(`4. Once verified, you can safely remove MemberHabit entries`);
    }
    
    return { migrated, errors };
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

/**
 * Verification script to check migration results
 */
async function verifyMigration() {
  try {
    console.log('🔍 Verifying migration results...');
    
    const memberHabitsCount = await MemberHabit.countDocuments({ isActive: true });
    const workspaceHabitsCount = await Habit.countDocuments({ source: 'workspace', isActive: true });
    
    console.log(`📊 Active MemberHabits: ${memberHabitsCount}`);
    console.log(`📊 Workspace Habits (new): ${workspaceHabitsCount}`);
    
    // Check for any habits without proper workspace references
    const invalidHabits = await Habit.find({
      source: 'workspace',
      $or: [
        { workspaceId: { $exists: false } },
        { workspaceHabitId: { $exists: false } }
      ]
    });
    
    if (invalidHabits.length > 0) {
      console.log(`⚠️  Found ${invalidHabits.length} workspace habits with missing references`);
    } else {
      console.log(`✅ All workspace habits have proper references`);
    }
    
    return {
      memberHabitsCount,
      workspaceHabitsCount,
      invalidHabits: invalidHabits.length
    };
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

/**
 * Rollback script (use with caution)
 */
async function rollbackMigration() {
  console.log('⚠️  WARNING: This will delete all workspace-sourced habits!');
  console.log('⚠️  Make sure you have a backup before proceeding.');
  
  // Uncomment the following lines to perform rollback
  /*
  const result = await Habit.deleteMany({ source: 'workspace' });
  console.log(`🗑️  Deleted ${result.deletedCount} workspace habits`);
  return result;
  */
  
  console.log('❌ Rollback is commented out for safety. Edit this script to enable it.');
}

module.exports = {
  migrateMemberHabitsToHabits,
  verifyMigration,
  rollbackMigration
};

// Run migration if this script is executed directly
if (require.main === module) {
  const mongoose = require('mongoose');
  
  // Connect to MongoDB
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/habittracker', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  migrateMemberHabitsToHabits()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}
