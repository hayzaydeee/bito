/**
 * migrate-habit-icons.js
 *
 * Migrates emoji icon values in Habit and GroupHabit collections to
 * Phosphor icon name strings (e.g. "🎯" → "Target").
 *
 * Usage:
 *   node scripts/migrate-habit-icons.js           # dry-run (no writes)
 *   node scripts/migrate-habit-icons.js --write   # apply changes
 */

const mongoose = require("mongoose");
require("dotenv").config();

// Known Phosphor icon names — used to detect already-migrated docs
const PHOSPHOR_NAMES = new Set([
  "Barbell", "Bicycle", "Person", "PersonSimple", "SwimmingPool", "Football",
  "Basketball", "Volleyball", "Drop", "Heart", "Pill", "Bed", "Tooth",
  "Leaf", "Sun", "Moon", "Brain", "BookOpen", "Notebook", "Pen", "Code",
  "Microphone", "Camera", "Palette", "MusicNote", "Target", "Lightning",
  "Clock", "Calendar", "ChartBar", "TrendUp", "Check", "Star", "Briefcase",
  "CurrencyDollar", "Users", "Globe", "House", "PawPrint", "Sparkle",
  "Handshake", "Smiley", "Trophy", "Medal", "Fire", "ChartBar", "ListChecks",
  "PlusCircle", "Warning", "MagnifyingGlass",
]);

const EMOJI_MAP = {
  // Common defaults
  "\uD83C\uDFAF": "Target",   // 🎯
  "\u2705": "Check",          // ✅
  "\uD83D\uDCAA": "Barbell",  // 💪
  "\uD83D\uDCDA": "BookOpen", // 📚
  "\uD83E\uDDE0": "Brain",    // 🧠
  "\uD83D\uDCA7": "Drop",     // 💧
  "\uD83C\uDFC3": "Person",   // 🏃
  "\uD83D\uDE0A": "Smiley",   // 😊
  "\uD83C\uDFCB\uFE0F": "Dumbbell", // 🏋️
  "\uD83E\uDDD8": "Yoga",     // 🧘
  "\uD83D\uDEB4": "Bicycle",  // 🚴
  "\uD83C\uDFCA": "SwimmingPool", // 🏊
  "\u2B50": "Star",           // ⭐
  "\uD83C\uDF31": "Leaf",     // 🌱
  "\u2764\uFE0F": "Heart",    // ❤️
  "\uD83D\uDC8A": "Pill",     // 💊
  "\uD83D\uDE34": "Bed",      // 😴
  "\uD83E\uDDB7": "Tooth",    // 🦷
  "\u2600\uFE0F": "Sun",      // ☀️
  "\uD83C\uDF19": "Moon",     // 🌙
  "\u23F0": "Clock",          // ⏰
  "\uD83D\uDCC5": "Calendar", // 📅
  "\uD83D\uDCBC": "Briefcase",// 💼
  "\uD83D\uDCDD": "Notebook", // 📝
  "\uD83D\uDCCA": "Chart",    // 📊
  "\uD83C\uDFA8": "Palette",  // 🎨
  "\uD83C\uDFB5": "MusicNote",// 🎵
  "\uD83D\uDCBB": "Code",     // 💻
  "\uD83C\uDFC6": "Trophy",   // 🏆
  "\u2728": "Sparkle",        // ✨
  "\uD83D\uDD25": "Fire",     // 🔥
  "\uD83E\uDD57": "Leaf",     // 🥗
  "\uD83C\uDF4E": "Leaf",     // 🍎
  "\uD83E\uDD66": "Leaf",     // 🥦
  "\u26BD": "Football",       // ⚽
  "\uD83C\uDFAE": "Target",   // 🎮 → repurpose as Target
  "\uD83D\uDEB6": "Person",   // 🚶
  "\uD83D\uDE0C": "Smiley",   // 😌
  "\uD83C\uDF08": "Sparkle",  // 🌈
  "\uD83C\uDF1E": "Sun",      // 🌞
  "\uD83D\uDCAD": "Brain",    // 💭
  "\uD83D\uDE4F": "Sparkle",  // 🙏
  "\uD83D\uDCAB": "Sparkle",  // 💫
  "\uD83D\uDD2E": "Sparkle",  // 🔮
  "\uD83D\uDCF1": "Notebook", // 📱
  "\u2709\uFE0F": "Notebook", // ✉️
  "\uD83D\uDD0D": "MagnifyingGlass", // 🔍
  "\u2699\uFE0F": "Sparkle",  // ⚙️
  "\uD83D\uDCAF": "Star",     // 💯
  "\uD83D\uDD34": "Target",   // 🔴
  "\uD83D\uDD35": "Target",   // 🔵
  "\uD83D\uDFE2": "Target",   // 🟢
  "\uD83E\uDDF9": "Check",    // 🧹
  "\uD83D\uDE4B": "Person",   // 🙋 (misc person variants)
};

// Fallback for any unrecognized emoji
const DEFAULT_ICON = "Target";

function isMigrated(icon) {
  return typeof icon === "string" && PHOSPHOR_NAMES.has(icon);
}

function mapIcon(icon) {
  if (!icon || typeof icon !== "string") return DEFAULT_ICON;
  if (isMigrated(icon)) return icon; // already a Phosphor name
  return EMOJI_MAP[icon] || DEFAULT_ICON;
}

async function migrate(collectionName, model, dryRun) {
  const docs = await model.find({ icon: { $exists: true } }).lean();
  let skipped = 0;
  let toUpdate = [];

  for (const doc of docs) {
    if (isMigrated(doc.icon)) {
      skipped++;
      continue;
    }
    const newIcon = mapIcon(doc.icon);
    toUpdate.push({ id: doc._id, old: doc.icon, new: newIcon });
  }

  console.log(`\n[${collectionName}]`);
  console.log(`  Total docs with icon field: ${docs.length}`);
  console.log(`  Already migrated (skipped): ${skipped}`);
  console.log(`  To update: ${toUpdate.length}`);

  if (toUpdate.length > 0) {
    const sample = toUpdate.slice(0, 5);
    console.log("  Sample changes:");
    sample.forEach((c) => console.log(`    "${c.old}" → "${c.new}"`));
  }

  if (!dryRun && toUpdate.length > 0) {
    const bulkOps = toUpdate.map((u) => ({
      updateOne: {
        filter: { _id: u.id },
        update: { $set: { icon: u.new } },
      },
    }));
    const result = await model.bulkWrite(bulkOps);
    console.log(`  Updated: ${result.modifiedCount} documents`);
  } else if (dryRun) {
    console.log("  [DRY RUN] No changes written.");
  }
}

async function main() {
  const dryRun = !process.argv.includes("--write");

  if (dryRun) {
    console.log("=== DRY RUN MODE (pass --write to apply changes) ===");
  } else {
    console.log("=== WRITE MODE — changes will be applied ===");
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("Error: MONGODB_URI or MONGO_URI environment variable not set.");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  // Load models dynamically to avoid circular dep issues
  const Habit = require("../models/Habit");
  const GroupHabit = require("../models/GroupHabit");

  await migrate("Habit", Habit, dryRun);
  await migrate("GroupHabit", GroupHabit, dryRun);

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
