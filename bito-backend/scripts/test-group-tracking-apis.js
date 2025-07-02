const mongoose = require('mongoose');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const WorkspaceHabit = require('../models/WorkspaceHabit');
const Habit = require('../models/Habit');

async function testGroupTrackingAPIs() {
  try {
    console.log('🧪 Testing Group Tracking API logic...\n');
    
    // Connect to database (adjust connection string as needed)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bito-test');
    
    // Test 1: Habit privacy method
    console.log('📝 Test 1: Testing workspace habit visibility...');
    
    const testHabit = new Habit({
      name: 'Test Workspace Habit',
      userId: new mongoose.Types.ObjectId(),
      source: 'workspace',
      workspaceId: new mongoose.Types.ObjectId(),
      workspaceHabitId: new mongoose.Types.ObjectId(),
      workspaceSettings: {
        shareProgress: 'progress-only',
        allowInteraction: true,
        shareInActivity: true
      },
      stats: {
        currentStreak: 5,
        completionRate: 80,
        totalChecks: 20
      }
    });
    
    // Test visibility for owner
    const ownerId = testHabit.userId.toString();
    const visibleToOwner = testHabit.getVisibleDataForWorkspace('member', ownerId);
    console.log('✅ Owner can see full data:', !!visibleToOwner);
    console.log('  - Current streak:', visibleToOwner?.stats?.currentStreak);
    console.log('  - Completion rate:', visibleToOwner?.stats?.completionRate);
    
    // Test visibility for other member
    const otherId = new mongoose.Types.ObjectId().toString();
    const visibleToOther = testHabit.getVisibleDataForWorkspace('member', otherId);
    console.log('✅ Other member sees filtered data:', !!visibleToOther);
    console.log('  - Can see streak:', !!visibleToOther?.stats?.currentStreak);
    console.log('  - Cannot see total checks:', !visibleToOther?.stats?.totalChecks);
    
    // Test 2: Privacy levels
    console.log('\n📝 Test 2: Testing different privacy levels...');
    
    const privateHabit = new Habit({
      name: 'Private Habit',
      userId: new mongoose.Types.ObjectId(),
      source: 'workspace',
      workspaceId: new mongoose.Types.ObjectId(),
      workspaceHabitId: new mongoose.Types.ObjectId(),
      workspaceSettings: {
        shareProgress: 'private',
        allowInteraction: false,
        shareInActivity: false
      }
    });
    
    const privateVisible = privateHabit.getVisibleDataForWorkspace('member', otherId);
    console.log('✅ Private habit hidden from others:', !privateVisible);
    
    const ownerPrivateVisible = privateHabit.getVisibleDataForWorkspace('member', privateHabit.userId.toString());
    console.log('✅ Private habit visible to owner:', !!ownerPrivateVisible);
    
    // Test 3: Interaction permissions
    console.log('\n📝 Test 3: Testing interaction permissions...');
    
    const canOwnerInteract = testHabit.canUserInteract(ownerId);
    const canOtherInteract = testHabit.canUserInteract(otherId);
    
    console.log('✅ Owner can interact:', canOwnerInteract);
    console.log('✅ Other member can interact (allowInteraction=true):', canOtherInteract);
    
    // Test no interaction habit
    const noInteractionHabit = new Habit({
      name: 'No Interaction Habit',
      userId: new mongoose.Types.ObjectId(),
      source: 'workspace',
      workspaceId: new mongoose.Types.ObjectId(),
      workspaceHabitId: new mongoose.Types.ObjectId(),
      workspaceSettings: {
        shareProgress: 'full',
        allowInteraction: false,
        shareInActivity: true
      }
    });
    
    const canOtherInteractNoPermission = noInteractionHabit.canUserInteract(otherId);
    console.log('✅ Other member cannot interact (allowInteraction=false):', !canOtherInteractNoPermission);
    
    console.log('\n🎉 All API logic tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

// Only run if called directly
if (require.main === module) {
  testGroupTrackingAPIs();
}

module.exports = testGroupTrackingAPIs;
