require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Compass = require('../models/Compass');
const Habit = require('../models/Habit');

async function sanitize(userId) {
  try {
    console.log(`Connecting to DB...`);
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to DB. Starting sanitization for user:', userId);

    const compasses = await Compass.find({ userId });
    let removedDanglingCount = 0;
    let archivedUpcomingCount = 0;
    let orphanedCompletelyCount = 0;

    // 1. Sanitize Compasses referencing missing habits
    for (const compass of compasses) {
      if (!compass.appliedResources || !compass.appliedResources.habitIds) continue;
      
      const habitIds = compass.appliedResources.habitIds;
      const validHabits = await Habit.find({ _id: { $in: habitIds } });
      const validHabitIds = validHabits.map(h => h._id.toString());

      const originalLength = habitIds.length;
      const filteredHabitIds = habitIds.filter(id => validHabitIds.includes(id.toString()));

      if (filteredHabitIds.length !== originalLength) {
        console.log(`[Compass ${compass._id}] Removing ${originalLength - filteredHabitIds.length} dangling habit references.`);
        compass.appliedResources.habitIds = filteredHabitIds;
        await compass.save();
        removedDanglingCount += (originalLength - filteredHabitIds.length);
      }

      // If compass is archived, archive any upcoming habits
      if (compass.status === 'archived') {
        for (const habit of validHabits) {
          if (!habit.isActive && !habit.isArchived) {
            console.log(`[Compass ${compass._id}] Archiving orphaned upcoming habit: ${habit.name}`);
            habit.isArchived = true;
            await habit.save();
            archivedUpcomingCount++;
          }
        }
      }
    }

    // 2. Sanitize Habits referencing missing/archived Compasses
    const compassHabits = await Habit.find({ userId, source: 'compass' });
    const existingCompassIds = compasses.map(c => c._id.toString());
    const archivedCompassIds = compasses.filter(c => c.status === 'archived').map(c => c._id.toString());

    for (const habit of compassHabits) {
      if (habit.compassId) {
        const cIdStr = habit.compassId.toString();
        // If compass is missing completely, or compass is archived, and habit is upcoming
        if (!existingCompassIds.includes(cIdStr)) {
          if (!habit.isArchived) {
            console.log(`[Habit ${habit._id}] Compass missing. Archiving orphaned habit: ${habit.name}`);
            habit.isArchived = true;
            await habit.save();
            orphanedCompletelyCount++;
          }
        } else if (archivedCompassIds.includes(cIdStr) && !habit.isActive && !habit.isArchived) {
          // Already handled in step 1, but just in case it wasn't in appliedResources
          console.log(`[Habit ${habit._id}] Compass archived. Archiving upcoming habit: ${habit.name}`);
          habit.isArchived = true;
          await habit.save();
          archivedUpcomingCount++;
        }
      }
    }

    console.log('Sanitization complete!');
    console.log(`- Dangling habit references removed from compasses: ${removedDanglingCount}`);
    console.log(`- Orphaned upcoming habits archived: ${archivedUpcomingCount}`);
    console.log(`- Orphaned habits missing compasses entirely: ${orphanedCompletelyCount}`);

  } catch (err) {
    console.error('Error during sanitization:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB.');
  }
}

const targetUserId = process.argv[2];
if (!targetUserId) {
  console.error('Please provide a userId as an argument.');
  process.exit(1);
}

sanitize(targetUserId);
