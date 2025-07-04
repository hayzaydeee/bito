const Challenge = require('../models/Challenge');
const Activity = require('../models/Activity');
const HabitEntry = require('../models/HabitEntry');

/**
 * Process challenge progress for a user's habit entry
 * This is called after a habit is completed to update relevant challenges
 */
const processChallengeProgress = async (userId, workspaceId, habitId) => {
  try {
    // Find active challenges that include this habit
    const activeChallenges = await Challenge.find({
      workspaceId,
      status: 'active',
      $or: [
        { habitIds: { $in: [habitId] } },  // Habit-specific challenges
        { habitIds: { $size: 0 } }         // General challenges (all habits)
      ]
    });

    if (!activeChallenges || activeChallenges.length === 0) {
      return { processed: false, message: 'No active challenges' };
    }

    const updates = [];

    for (const challenge of activeChallenges) {
      const participantIndex = challenge.participants.findIndex(
        p => p.userId.toString() === userId.toString()
      );

      if (participantIndex === -1) continue; // User not participating in this challenge

      const participant = challenge.participants[participantIndex];
      
      // Update progress based on challenge type
      switch (challenge.type) {
        case 'streak':
          // For streak, we need to check consecutive days
          const today = new Date().toISOString().split('T')[0];
          const recentEntries = await HabitEntry.find({
            userId,
            workspaceId,
            habitId: habitId,
            date: { $lte: today },
            completed: true
          }).sort({ date: -1 }).limit(challenge.target);
          
          // Count consecutive days (simple streak calculation)
          let streakCount = 1;  // Today counts as 1
          
          if (recentEntries.length > 1) {
            for (let i = 0; i < recentEntries.length - 1; i++) {
              const curr = new Date(recentEntries[i].date);
              const prev = new Date(recentEntries[i + 1].date);
              const diffDays = Math.round((curr - prev) / (24 * 60 * 60 * 1000));
              
              if (diffDays === 1) {
                streakCount++;
              } else {
                break;  // Streak broken
              }
            }
          }
          
          // Update participant progress
          challenge.participants[participantIndex].progress = streakCount;
          if (streakCount >= challenge.target) {
            challenge.participants[participantIndex].completed = true;
          }
          
          updates.push({ id: challenge._id, type: 'streak', progress: streakCount });
          break;
        
        case 'collective':
          // For collective, increment the global challenge count
          challenge.current += 1;
          updates.push({ id: challenge._id, type: 'collective', progress: challenge.current });
          
          // Update completion status if target is reached
          if (challenge.current >= challenge.target) {
            challenge.status = 'completed';
            
            // Create a challenge completion activity
            const activity = new Activity({
              workspaceId,
              type: 'challenge_completed',
              data: {
                challengeId: challenge._id,
                challengeName: challenge.title,
                challengeType: challenge.type,
              }
            });
            await activity.save();
          }
          break;
        
        case 'completion':
        case 'habit-specific':
          // Increment individual progress
          challenge.participants[participantIndex].progress += 1;
          const newProgress = challenge.participants[participantIndex].progress;
          
          if (newProgress >= challenge.target) {
            challenge.participants[participantIndex].completed = true;
          }
          
          updates.push({ id: challenge._id, type: challenge.type, progress: newProgress });
          break;
      }
      
      // Save the challenge with updated progress
      await challenge.save();
    }

    return { processed: true, updates };
    
  } catch (error) {
    console.error('Error processing challenge progress:', error);
    return { processed: false, error: error.message };
  }
};

/**
 * Update challenge statistics based on workspace habit completion data
 * This can be run as a scheduled job to sync challenge progress
 */
const syncChallengeProgress = async (workspaceId) => {
  try {
    // Find active challenges in the workspace
    const activeChallenges = await Challenge.find({
      workspaceId,
      status: 'active'
    });
    
    if (!activeChallenges || activeChallenges.length === 0) {
      return { synced: false, message: 'No active challenges' };
    }
    
    // Process each challenge type
    for (const challenge of activeChallenges) {
      switch (challenge.type) {
        case 'collective':
          // Calculate collective completion count
          const completionCount = await HabitEntry.countDocuments({
            workspaceId,
            completed: true,
            date: {
              $gte: challenge.startDate,
              $lte: challenge.endDate
            }
          });
          
          challenge.current = completionCount;
          
          // Check if target achieved
          if (completionCount >= challenge.target) {
            challenge.status = 'completed';
          }
          break;
          
        // Add other challenge type syncing as needed
      }
      
      await challenge.save();
    }
    
    return { synced: true };
    
  } catch (error) {
    console.error('Error syncing challenge progress:', error);
    return { synced: false, error: error.message };
  }
};

module.exports = {
  processChallengeProgress,
  syncChallengeProgress
};
