#!/usr/bin/env node
/**
 * Migration: seed progressSnapshot for all active challenge participants.
 *
 * Run once after deploying Phase 4. Performs a full progress scan for every
 * active participant in every active challenge and writes progressSnapshot to
 * their participant subdoc so future check-ins can use the delta path.
 *
 * Usage:
 *   MONGODB_URI=mongodb://... node scripts/rebuildChallengeProgress.js
 *   or just: node scripts/rebuildChallengeProgress.js (reads .env)
 */

'use strict';

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

mongoose.connect(MONGO_URI).then(run).catch((err) => {
  console.error('DB connect failed:', err.message);
  process.exit(1);
});

async function run() {
  const Challenge = require('../models/Challenge');
  const HabitEntry = require('../models/HabitEntry');
  const Habit = require('../models/Habit');

  // Replicate helpers from controller (without requiring the full module)
  function isHabitScheduledOnDay(habitMeta, dow) {
    if (!habitMeta || habitMeta.frequency !== 'daily') return true;
    const days = habitMeta.schedule?.days;
    if (!days || days.length === 0) return true;
    return days.includes(dow);
  }
  function isDayExempt(dateMs, habitMetas) {
    const dow = new Date(dateMs).getUTCDay();
    return habitMetas.every((h) => !isHabitScheduledOnDay(h, dow));
  }
  function countScheduledDays(start, end, habitMetas) {
    let count = 0;
    const cursor = new Date(start); cursor.setUTCHours(0, 0, 0, 0);
    const endD = new Date(end); endD.setUTCHours(0, 0, 0, 0);
    while (cursor <= endD) {
      if (!isDayExempt(cursor.getTime(), habitMetas)) count++;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return count;
  }

  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const now = new Date();

  const challenges = await Challenge.find({ status: 'active' });
  console.log(`Found ${challenges.length} active challenges`);

  let total = 0;
  let updated = 0;
  let errors = 0;

  for (const challenge of challenges) {
    const activeParticipants = challenge.participants.filter((p) => p.status === 'active');

    // Collect all habit IDs for this challenge
    const allHabitIdSet = new Set();
    for (const p of activeParticipants) {
      if (p.linkedHabitIds?.length) p.linkedHabitIds.forEach((id) => allHabitIdSet.add(String(id)));
      else if (p.linkedHabitId) allHabitIdSet.add(String(p.linkedHabitId));
    }

    if (!allHabitIdSet.size) continue;

    const habitDocs = await Habit.find({ _id: { $in: [...allHabitIdSet] } })
      .select('frequency weeklyTarget schedule.days methodology target').lean();
    const habitMetaMap = new Map(habitDocs.map((h) => [String(h._id), h]));

    for (const participant of activeParticipants) {
      total++;
      try {
        let habitIds = [];
        if (participant.linkedHabitIds?.length) habitIds = participant.linkedHabitIds.map(String);
        else if (participant.linkedHabitId) habitIds = [String(participant.linkedHabitId)];
        if (!habitIds.length) continue;

        const habitMetas = habitIds.map((id) => habitMetaMap.get(id)).filter(Boolean);
        const end = new Date(Math.min(now.getTime(), new Date(challenge.endDate).getTime()));

        let snapshotData = { snapshotDate: today };

        if (challenge.type === 'streak') {
          const entries = await HabitEntry.find({
            habitId: { $in: habitIds },
            userId: participant.userId,
            completed: true,
            date: { $gte: challenge.startDate },
          }).select('date habitId').lean();

          const dateHabitMap = new Map();
          for (const e of entries) {
            const d = new Date(e.date); d.setUTCHours(0, 0, 0, 0);
            const key = d.getTime();
            if (!dateHabitMap.has(key)) dateHabitMap.set(key, new Set());
            dateHabitMap.get(key).add(String(e.habitId));
          }

          let streak = 0;
          const cursor = new Date(today);
          const startMs = new Date(challenge.startDate).getTime();
          for (let i = 0; i < 1000; i++) {
            const ts = cursor.getTime();
            if (ts < startMs) break;
            if (isDayExempt(ts, habitMetas)) { cursor.setUTCDate(cursor.getUTCDate() - 1); continue; }
            if (!dateHabitMap.get(ts)?.size) break;
            streak++;
            cursor.setUTCDate(cursor.getUTCDate() - 1);
          }
          snapshotData = { currentValue: streak, currentStreak: streak, bestStreak: Math.max(participant.progress?.bestStreak || 0, streak), snapshotDate: today };

        } else if (challenge.type === 'cumulative' || challenge.type === 'team_goal') {
          const numericIds = habitIds.filter((id) => {
            const m = habitMetaMap.get(id);
            return m?.methodology === 'numeric' || m?.methodology === 'duration';
          });
          const countIds = habitIds.filter((id) => !numericIds.includes(id));
          const dateFilter = {};
          if (challenge.startDate) dateFilter.$gte = challenge.startDate;
          if (challenge.endDate) dateFilter.$lte = challenge.endDate;

          let total_ = 0;
          if (numericIds.length) {
            const [r] = await HabitEntry.aggregate([
              { $match: { habitId: { $in: numericIds }, userId: participant.userId, completed: true, date: dateFilter } },
              { $group: { _id: null, total: { $sum: '$value' } } },
            ]);
            total_ += r?.total || 0;
          }
          if (countIds.length) {
            const [r] = await HabitEntry.aggregate([
              { $match: { habitId: { $in: countIds }, userId: participant.userId, completed: true, date: dateFilter } },
              { $group: { _id: null, count: { $sum: 1 } } },
            ]);
            total_ += r?.count || 0;
          }
          snapshotData = { currentValue: total_, snapshotDate: today };

        } else if (challenge.type === 'consistency') {
          const scheduledDaysTotal = countScheduledDays(challenge.startDate, end, habitMetas);
          const entries = await HabitEntry.find({
            habitId: { $in: habitIds },
            userId: participant.userId,
            completed: true,
            date: { $gte: challenge.startDate, $lte: now },
          }).select('date').lean();

          const completedSet = new Set();
          for (const e of entries) {
            const d = new Date(e.date); d.setUTCHours(0, 0, 0, 0);
            if (!isDayExempt(d.getTime(), habitMetas)) completedSet.add(d.getTime());
          }
          const scheduledDaysCompleted = completedSet.size;
          const rate = scheduledDaysTotal > 0 ? Math.round((scheduledDaysCompleted / scheduledDaysTotal) * 100) : 0;
          snapshotData = { currentValue: scheduledDaysCompleted, completionRate: rate, scheduledDaysCompleted, scheduledDaysTotal, snapshotDate: today };
        }

        participant.progressSnapshot = snapshotData;
        participant.lastComputedAt = now;
        updated++;
      } catch (err) {
        console.error(`  Error for participant ${participant.userId} in challenge ${challenge._id}:`, err.message);
        errors++;
      }
    }

    await challenge.save();
    console.log(`  Challenge ${challenge._id} (${challenge.title}): ${activeParticipants.length} participants processed`);
  }

  console.log(`\nDone. ${total} participants scanned, ${updated} snapshots written, ${errors} errors.`);
  await mongoose.disconnect();
}
