const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;

async function fix() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  // Fix array fields in users
  console.log('Fixing dashboardSharingPermissions array fields...');
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
  console.log(`  Done: ${usersWithPerms.length} user(s)`);

  // Step 11: memberhabits
  console.log('Renaming fields in memberhabits...');
  const mh = db.collection('memberhabits');
  const r = await mh.updateMany({}, { $rename: { workspaceId: 'groupId', workspaceHabitId: 'groupHabitId' } });
  console.log(`  Done: ${r.modifiedCount} docs`);

  console.log('\nMigration complete!');
  await client.close();
}

fix().catch(e => { console.error(e); process.exit(1); });
