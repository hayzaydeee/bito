#!/usr/bin/env node
/**
 * MongoDB Migration Script — Codebase Rename
 *
 * Renames:
 *   1. Transformers → Compass  (collection: transformers → compass)
 *   2. Workspaces  → Groups    (collection: workspaces → groups)
 *   3. WorkspaceHabits → GroupHabits (collection: workspacehabits → grouphabits)
 *   4. Field renames across all affected collections
 *
 * Usage:
 *   MONGODB_URI=mongodb://... node scripts/migrate-rename.js
 *
 * This script is idempotent — safe to re-run (skips steps already done).
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bito-db';

async function run() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  console.log('🚀 Starting rename migration...\n');

  // ─── Helper: rename collection (skip if already done) ───
  async function renameCollection(oldName, newName) {
    const collections = await db.listCollections({ name: oldName }).toArray();
    if (collections.length === 0) {
      console.log(`  ⏭  Collection "${oldName}" not found (already renamed or doesn't exist). Skipping.`);
      return false;
    }
    await db.collection(oldName).rename(newName);
    console.log(`  ✅ Renamed collection "${oldName}" → "${newName}"`);
    return true;
  }

  // ─── Helper: rename fields in a collection ───
  async function renameFields(collectionName, fieldMap) {
    const col = db.collection(collectionName);
    const exists = (await db.listCollections({ name: collectionName }).toArray()).length > 0;
    if (!exists) {
      console.log(`  ⏭  Collection "${collectionName}" not found. Skipping field renames.`);
      return;
    }
    // Build $rename map
    const renameMap = {};
    for (const [oldField, newField] of Object.entries(fieldMap)) {
      renameMap[oldField] = newField;
    }
    if (Object.keys(renameMap).length > 0) {
      const result = await col.updateMany({}, { $rename: renameMap });
      console.log(`  ✅ Renamed fields in "${collectionName}": ${Object.entries(fieldMap).map(([o, n]) => `${o}→${n}`).join(', ')} (${result.modifiedCount} docs)`);
    }
  }

  // ─── Helper: update enum/string values in a collection ───
  async function updateValues(collectionName, updates) {
    const col = db.collection(collectionName);
    const exists = (await db.listCollections({ name: collectionName }).toArray()).length > 0;
    if (!exists) {
      console.log(`  ⏭  Collection "${collectionName}" not found. Skipping value updates.`);
      return;
    }
    for (const { filter, update, label } of updates) {
      const result = await col.updateMany(filter, update);
      if (result.modifiedCount > 0) {
        console.log(`  ✅ ${label} in "${collectionName}" (${result.modifiedCount} docs)`);
      }
    }
  }

  // ═══════════════════════════════════════════
  // STEP 1: Rename collections
  // ═══════════════════════════════════════════
  console.log('── Step 1: Rename collections ──');
  await renameCollection('transformers', 'compass');
  await renameCollection('workspaces', 'groups');
  await renameCollection('workspacehabits', 'grouphabits');

  // ═══════════════════════════════════════════
  // STEP 2: Rename fields in "compass" (formerly transformers)
  // ═══════════════════════════════════════════
  console.log('\n── Step 2: Rename fields in "compass" ──');
  await renameFields('compass', {
    'workspaceId': 'groupId',
  });

  // ═══════════════════════════════════════════
  // STEP 3: Rename fields in "groups" (formerly workspaces)
  // ═══════════════════════════════════════════
  console.log('\n── Step 3: Rename fields in "groups" ──');
  // No field renames needed — the schema field names (name, ownerId, members, etc.) stay the same.
  // The model name and collection name change, that's all.

  // ═══════════════════════════════════════════
  // STEP 4: Rename fields in "grouphabits" (formerly workspacehabits)
  // ═══════════════════════════════════════════
  console.log('\n── Step 4: Rename fields in "grouphabits" ──');
  await renameFields('grouphabits', {
    'workspaceId': 'groupId',
    'workspaceSettings': 'groupSettings',
  });

  // ═══════════════════════════════════════════
  // STEP 5: Rename fields in "habits"
  // ═══════════════════════════════════════════
  console.log('\n── Step 5: Rename fields in "habits" ──');
  await renameFields('habits', {
    'transformerId': 'compassId',
    'transformerPhaseId': 'compassPhaseId',
    'workspaceId': 'groupId',
    'workspaceHabitId': 'groupHabitId',
    'workspaceSettings': 'groupSettings',
  });
  // Update source enum values
  await updateValues('habits', [
    {
      filter: { source: 'transformer' },
      update: { $set: { source: 'compass' } },
      label: 'Updated source "transformer" → "compass"'
    },
    {
      filter: { source: 'workspace' },
      update: { $set: { source: 'group' } },
      label: 'Updated source "workspace" → "group"'
    },
  ]);

  // ═══════════════════════════════════════════
  // STEP 6: Rename fields in "activities"
  // ═══════════════════════════════════════════
  console.log('\n── Step 6: Rename fields in "activities" ──');
  await renameFields('activities', {
    'workspaceId': 'groupId',
  });
  await updateValues('activities', [
    {
      filter: { visibility: 'workspace' },
      update: { $set: { visibility: 'group' } },
      label: 'Updated visibility "workspace" → "group"'
    },
  ]);

  // ═══════════════════════════════════════════
  // STEP 7: Rename fields in "invitations"
  // ═══════════════════════════════════════════
  console.log('\n── Step 7: Rename fields in "invitations" ──');
  await renameFields('invitations', {
    'workspaceId': 'groupId',
  });

  // ═══════════════════════════════════════════
  // STEP 8: Rename fields in "challenges"
  // ═══════════════════════════════════════════
  console.log('\n── Step 8: Rename fields in "challenges" ──');
  await renameFields('challenges', {
    'workspaceId': 'groupId',
    'workspaceHabitId': 'groupHabitId',
  });

  // ═══════════════════════════════════════════
  // STEP 9: Rename fields in "encouragements"
  // ═══════════════════════════════════════════
  console.log('\n── Step 9: Rename fields in "encouragements" ──');
  await renameFields('encouragements', {
    'workspace': 'group',
  });

  // ═══════════════════════════════════════════
  // STEP 10: Rename fields in "users"
  // ═══════════════════════════════════════════
  console.log('\n── Step 10: Rename fields in "users" ──');
  await renameFields('users', {
    'subscription.limits.maxActiveTransformers': 'subscription.limits.maxActiveCompass',
    'subscription.limits.maxWorkspacesJoined': 'subscription.limits.maxGroupsJoined',
    'subscription.limits.maxWorkspacesCreated': 'subscription.limits.maxGroupsCreated',
    'subscription.limits.maxWorkspaceMembers': 'subscription.limits.maxGroupMembers',
  });
  // Rename dashboardSharingPermissions sub-fields (array elements — $rename can't handle $[])
  const usersCol = db.collection('users');
  const usersWithPerms = await usersCol.find({ dashboardSharingPermissions: { $exists: true, $ne: [] } }).toArray();
  for (const user of usersWithPerms) {
    const updated = user.dashboardSharingPermissions.map(perm => {
      const newPerm = { ...perm };
      if ('workspaceId' in newPerm) { newPerm.groupId = newPerm.workspaceId; delete newPerm.workspaceId; }
      if ('isPublicToWorkspace' in newPerm) { newPerm.isPublicToGroup = newPerm.isPublicToWorkspace; delete newPerm.isPublicToWorkspace; }
      return newPerm;
    });
    await usersCol.updateOne({ _id: user._id }, { $set: { dashboardSharingPermissions: updated } });
  }
  console.log(`  ✅ Renamed array fields in dashboardSharingPermissions for ${usersWithPerms.length} user(s)`);

  // ═══════════════════════════════════════════
  // STEP 11: Rename fields in "memberhabits"
  // ═══════════════════════════════════════════
  console.log('\n── Step 11: Rename fields in "memberhabits" ──');
  await renameFields('memberhabits', {
    'workspaceId': 'groupId',
    'workspaceHabitId': 'groupHabitId',
  });

  console.log('\n🎉 Migration complete!\n');
  await client.close();
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
