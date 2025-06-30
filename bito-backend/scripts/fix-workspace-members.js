#!/usr/bin/env node

/**
 * Fix corrupted workspace member data
 * 
 * This script fixes the issue where userId fields in workspace members
 * contain stringified user objects instead of ObjectIds
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bito-db';

const fixWorkspaceMembers = async () => {
  try {
    console.log('🔧 Starting workspace member data fix...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const workspacesCollection = db.collection('workspaces');
    
    // Find all workspaces
    const workspaces = await workspacesCollection.find({}).toArray();
    console.log(`📋 Found ${workspaces.length} workspaces to check`);
    
    let fixedCount = 0;
    let totalMembersFixed = 0;
    
    for (const workspace of workspaces) {
      let needsUpdate = false;
      const originalMembers = [...workspace.members];
      
      if (workspace.members) {
        workspace.members = workspace.members.map((member, index) => {
          // Check if userId is a stringified object containing _id
          if (typeof member.userId === 'string' && member.userId.includes('_id: new ObjectId(')) {
            console.log(`🔍 Found corrupted userId in workspace "${workspace.name}":`, member.userId.substring(0, 100) + '...');
            
            // Extract the actual ObjectId from the stringified object
            const match = member.userId.match(/_id: new ObjectId\('([^']+)'\)/);
            if (match && match[1]) {
              const extractedId = match[1];
              console.log(`✅ Extracted ObjectId: ${extractedId}`);
              
              // Create a proper ObjectId
              member.userId = new mongoose.Types.ObjectId(extractedId);
              needsUpdate = true;
              totalMembersFixed++;
              
              console.log(`   Fixed member ${index + 1}: ${member.role} (${member.status})`);
            } else {
              console.log(`❌ Could not extract ObjectId from: ${member.userId}`);
            }
          } else if (typeof member.userId === 'string' && mongoose.Types.ObjectId.isValid(member.userId)) {
            // Convert valid string ObjectIds to proper ObjectIds
            member.userId = new mongoose.Types.ObjectId(member.userId);
            console.log(`🔄 Converted string ObjectId to proper ObjectId: ${member.userId}`);
          }
          return member;
        });
      }
      
      if (needsUpdate) {
        console.log(`💾 Updating workspace: ${workspace.name} (${workspace._id})`);
        
        const result = await workspacesCollection.updateOne(
          { _id: workspace._id },
          { $set: { members: workspace.members } }
        );
        
        if (result.modifiedCount === 1) {
          fixedCount++;
          console.log(`✅ Successfully updated workspace: ${workspace.name}`);
        } else {
          console.log(`❌ Failed to update workspace: ${workspace.name}`);
        }
      }
    }
    
    console.log('\n📊 Fix Summary:');
    console.log(`   Workspaces checked: ${workspaces.length}`);
    console.log(`   Workspaces fixed: ${fixedCount}`);
    console.log(`   Members fixed: ${totalMembersFixed}`);
    
    if (fixedCount > 0) {
      console.log('\n🎉 Workspace member data has been successfully fixed!');
      console.log('   Users should now be able to access their workspaces properly.');
    } else {
      console.log('\n✨ No corrupted data found. All workspaces are already in good shape!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing workspace data:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

// Run the fix
if (require.main === module) {
  fixWorkspaceMembers().catch(console.error);
}

module.exports = { fixWorkspaceMembers };
