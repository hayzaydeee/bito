const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');

// Load environment variables
require('dotenv').config();

async function fixWorkspaceMemberships() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all workspaces with potential membership issues
    const workspaces = await Workspace.find({});
    
    let fixedCount = 0;
    
    for (const workspace of workspaces) {
      let needsUpdate = false;
      
      console.log(`\n🔍 Checking workspace: ${workspace.name} (${workspace._id})`);
      console.log(`   Current members:`, workspace.members.map(m => ({ 
        userId: m.userId, 
        userIdType: typeof m.userId,
        userIdString: m.userId.toString(),
        role: m.role 
      })));
      
      // Check each member
      workspace.members = workspace.members.map(member => {
        const userIdStr = member.userId.toString();
        
        // Check if userId contains unwanted text (like the debug output showed)
        if (userIdStr.includes('_id:') || userIdStr.includes('email:') || userIdStr.includes('name:')) {
          console.log(`🔧 Found corrupted userId: ${userIdStr}`);
          
          // Try to extract ObjectId from the corrupted string
          const objectIdMatch = userIdStr.match(/ObjectId\('([a-f\d]{24})'\)/);
          const plainIdMatch = userIdStr.match(/([a-f\d]{24})/);
          
          if (objectIdMatch) {
            console.log(`🔧 Extracting ObjectId: ${objectIdMatch[1]}`);
            member.userId = new mongoose.Types.ObjectId(objectIdMatch[1]);
            needsUpdate = true;
          } else if (plainIdMatch) {
            console.log(`🔧 Extracting plain ID: ${plainIdMatch[1]}`);
            member.userId = new mongoose.Types.ObjectId(plainIdMatch[1]);
            needsUpdate = true;
          } else {
            console.log(`❌ Could not extract valid ObjectId from: ${userIdStr}`);
          }
        } else if (typeof member.userId === 'string' && mongoose.Types.ObjectId.isValid(member.userId)) {
          // Convert string ObjectId to proper ObjectId
          member.userId = new mongoose.Types.ObjectId(member.userId);
          needsUpdate = true;
          console.log(`🔧 Converting string ObjectId to proper ObjectId: ${member.userId}`);
        }
        
        return member;
      });
      
      if (needsUpdate) {
        await workspace.save();
        fixedCount++;
        console.log(`✅ Fixed workspace: ${workspace.name}`);
        console.log(`   Updated members:`, workspace.members.map(m => ({ 
          userId: m.userId.toString(), 
          role: m.role 
        })));
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} workspaces`);
    
  } catch (error) {
    console.error('❌ Error fixing workspace memberships:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the fix
fixWorkspaceMemberships();
