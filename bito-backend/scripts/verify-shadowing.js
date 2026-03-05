const fs = require('fs');
const c = fs.readFileSync('routes/groups.js','utf8').split('\n');

console.log('=== Remaining "const Group" (should only be import) ===');
c.forEach((l,i) => {
  if (/\bconst Group\b/.test(l)) console.log('L' + (i+1) + ': ' + l.trim());
});

console.log('\n=== Remaining "const GroupHabit" (should only be import) ===');
c.forEach((l,i) => {
  if (/\bconst GroupHabit\b/.test(l)) console.log('L' + (i+1) + ': ' + l.trim());
});

console.log('\n=== Lines with uppercase Group. (potential remaining issues) ===');
c.forEach((l,i) => {
  if (i > 14 && /\bGroup\./.test(l)) console.log('L' + (i+1) + ': ' + l.trim());
});
