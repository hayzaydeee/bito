// Fix variable shadowing in groups.js
// Renames local `Group` variables to `group` and local `GroupHabit` to `groupHabit`
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'routes', 'groups.js');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Instance properties/methods (local variable, NOT model static methods)
const instanceProps = [
  '_id', 'name', 'members', 'save', 'toObject', 'getMemberRole', 'isMember',
  'canUserAccess', 'ownerId', 'stats', 'settings', 'type', 'description',
  'updatedAt', 'memberCount', 'getDefaultPermissions', 'populate', 'push',
  'groupId' // from invitation.groupId reference
];

// Model static methods (should stay as `Group.xxx`)
const staticMethods = [
  'findById', 'findByIdAndDelete', 'find', 'findOne', 'aggregate',
  'updateOne', 'updateMany', 'countDocuments', 'deleteMany', 'create',
  'findOneAndUpdate', 'findOneAndDelete', 'findByIdAndUpdate'
];

const ghInstanceProps = [
  '_id', 'name', 'groupId', 'save', 'toObject', 'habitName', 'description',
  'frequency', 'members', 'stats', 'visibility', 'category', 'populate',
  'isActive', 'settings'
];

const ghStaticMethods = [
  'findById', 'findByIdAndDelete', 'find', 'findOne', 'findByGroup',
  'aggregate', 'updateOne', 'updateMany', 'countDocuments', 'deleteMany',
  'create', 'findOneAndUpdate', 'findOneAndDelete', 'findByIdAndUpdate'
];

let changed = 0;

for (let i = 0; i < lines.length; i++) {
  const lineNum = i + 1;
  let line = lines[i];
  
  // Skip the import lines (line 6 and 7)
  if (lineNum <= 15 && (line.includes("require('../models/Group')") || line.includes("require('../models/GroupHabit')"))) {
    continue;
  }
  
  // Fix local variable declarations: `const Group = await Group.findById` → `const group = await Group.findById`
  // Also: `const Group = new Group(` → `const group = new Group(`
  // Also: `const Group = invitation.groupId` → `const group = invitation.groupId`
  if (/\b(const|let)\s+Group\s*=/.test(line)) {
    line = line.replace(/\b(const|let)\s+Group\s*=/, '$1 group =');
    changed++;
  }
  
  // Fix local GroupHabit declarations
  if (/\b(const|let)\s+GroupHabit\s*=/.test(line) && !line.includes("require(")) {
    line = line.replace(/\b(const|let)\s+GroupHabit\s*=/, '$1 groupHabit =');
    changed++;
  }
  
  // Now fix instance usages: `Group._id` → `group._id`, etc.
  // But NOT model calls like `Group.findById`
  for (const prop of instanceProps) {
    // Match `Group.prop` but not when it's part of a model static call
    const regex = new RegExp(`\\bGroup\\.${prop}\\b`, 'g');
    if (regex.test(line)) {
      line = line.replace(new RegExp(`\\bGroup\\.${prop}\\b`, 'g'), `group.${prop}`);
      changed++;
    }
  }
  
  // Fix `await Group.save()` → `await group.save()`
  // Fix `await Group.populate(...)` → `await group.populate(...)`
  // These are instance methods being called
  
  // Fix GroupHabit instance usages
  for (const prop of ghInstanceProps) {
    const regex = new RegExp(`\\bGroupHabit\\.${prop}\\b`, 'g');
    if (regex.test(line)) {
      line = line.replace(new RegExp(`\\bGroupHabit\\.${prop}\\b`, 'g'), `groupHabit.${prop}`);
      changed++;
    }
  }
  
  // Fix special cases:
  // `Group` used standalone in response objects like `res.json({ ... Group })` or `group: Group`
  // These patterns: `: Group,` or `: Group }` or `group: Group`
  if (/:\s*Group[,}\s]/.test(line) && !line.includes('Group.') && !line.includes("require(") && !line.includes("'Group'") && !line.includes('"Group"')) {
    // This is likely passing the local variable, like `group: Group` 
    line = line.replace(/:\s*Group([,}\s])/g, ': group$1');
    changed++;
  }
  
  // Fix `...Group.toObject()` already handled above
  
  // Fix lines like `Group: Group.name,` which should be `group: group.name,`  
  // The key on left side (`Group:`) needs to stay as-is since it's an object key name
  // Actually no - object keys named `Group` should also be renamed if they referred to `workspace`
  // Let's check: `Group: Group.name` → `group: group.name` — the key name was `workspace` before
  
  lines[i] = line;
}

const result = lines.join('\n');
fs.writeFileSync(filePath, result, 'utf8');
console.log(`Done! Made ${changed} line changes.`);

// Verify no remaining `const Group =` (except import)
const remaining = result.split('\n').filter((l, i) => 
  i > 14 && /\bconst Group\s*=/.test(l)
);
if (remaining.length > 0) {
  console.log(`\nWARNING: ${remaining.length} remaining 'const Group =' declarations:`);
  remaining.forEach(l => console.log('  ', l.trim()));
}

// Check for GroupHabit shadowing
const ghRemaining = result.split('\n').filter((l, i) => 
  i > 14 && /\bconst GroupHabit\s*=/.test(l) && !l.includes("require(")
);
if (ghRemaining.length > 0) {
  console.log(`\nWARNING: ${ghRemaining.length} remaining 'const GroupHabit =' declarations:`);
  ghRemaining.forEach(l => console.log('  ', l.trim()));
}
