#!/usr/bin/env node

/**
 * Test script to verify workspace membership fixes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bito-db';

const testWorkspaceMembership = async () => {
  try {
    console.log('🧪 Testing workspace membership fixes...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find the user's workspace
    const userId = '6859eb459776f4675dba9f7c';
    const workspaceId = '6861f25f615b980fdf508ecb';
    
    console.log(`\n🔍 Testing membership for user: ${userId}`);
    console.log(`   In workspace: ${workspaceId}`);
    
    const workspace = await Workspace.findById(workspaceId);
    
    if (!workspace) {
      console.log('❌ Workspace not found');
      return;
    }
    
    console.log(`\n📋 Workspace: ${workspace.name}`);
    console.log(`   Members (${workspace.members.length}):`);
    
    workspace.members.forEach((member, index) => {
      console.log(`   ${index + 1}. User ID: ${member.userId}`);
      console.log(`      Type: ${typeof member.userId}`);
      console.log(`      String: ${member.userId.toString()}`);
      console.log(`      Role: ${member.role}`);
      console.log(`      Status: ${member.status}`);
      console.log();
    });
    
    // Test isMember method
    const isMember = workspace.isMember(userId);
    console.log(`🔐 isMember result: ${isMember}`);
    
    // Test getMemberRole method
    const memberRole = workspace.getMemberRole(userId);
    console.log(`👤 Member role: ${memberRole}`);
    
    if (isMember) {
      console.log('\n🎉 SUCCESS: User is correctly recognized as a member!');
    } else {
      console.log('\n❌ FAILED: User is not recognized as a member');
      
      // Check if there's a corrupted member entry
      const corruptedMember = workspace.members.find(m => 
        typeof m.userId === 'string' && m.userId.includes('_id:')
      );
      
      if (corruptedMember) {
        console.log('\n🔍 Found corrupted member data:');
        console.log(`   Corrupted userId: ${corruptedMember.userId.substring(0, 100)}...`);
        console.log('\n💡 Run the fix script: npm run fix-workspaces');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing workspace membership:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
};

// Run the test
if (require.main === module) {
  testWorkspaceMembership().catch(console.error);
}

module.exports = { testWorkspaceMembership };
