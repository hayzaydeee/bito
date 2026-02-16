/**
 * Personality-aware reminder message templates.
 * 
 * Pre-written messages keyed by tone × accountability.
 * These are NOT LLM-generated — latency and cost make real-time
 * generation impractical for push notifications.
 * 
 * Template variables:
 *   {habitName} — the habit's display name
 *   {habitIcon} — the habit's emoji icon
 *   {streak}    — current streak count
 */

const reminderMessages = {
  // ── Warm ──────────────────────────────────────────────
  'warm-gentle': [
    `Hey, {habitName} is on your list today — whenever you're ready.`,
    `{habitIcon} Just a little nudge for {habitName}. No pressure.`,
    `{habitName} is waiting for you today. You've been doing so well with this one.`,
    `Friendly reminder: {habitName}. Even on busy days, you usually find a way.`,
  ],
  'warm-honest': [
    `{habitIcon} {habitName} — today's the day. You're at a {streak}-day streak.`,
    `Don't let {habitName} slip today. You've built real momentum here.`,
    `{habitName} check-in time. Your {streak}-day streak says you've got the rhythm.`,
    `{habitIcon} Time for {habitName}. Let's keep that streak alive.`,
  ],
  'warm-tough': [
    `{habitIcon} {habitName}. You know what to do — go do it.`,
    `{habitName} won't complete itself. Your {streak}-day streak is counting on you.`,
    `No excuses on {habitName} today. You've proven you can do this.`,
    `{habitIcon} {habitName} is non-negotiable today. Make it happen.`,
  ],

  // ── Direct ────────────────────────────────────────────
  'direct-gentle': [
    `{habitIcon} {habitName} — on the list for today.`,
    `Reminder: {habitName}. Small step, still counts.`,
    `{habitName} is up. Do what you can today.`,
    `{habitIcon} {habitName} when you're ready.`,
  ],
  'direct-honest': [
    `{habitIcon} {habitName}. Streak: {streak} days. Don't break it.`,
    `{habitName}: due today. Current streak is {streak}.`,
    `{habitIcon} {habitName}. Get it done.`,
    `Time for {habitName}. {streak}-day streak on the line.`,
  ],
  'direct-tough': [
    `{habitIcon} {habitName}. Today. Don't let the streak slip.`,
    `{habitName}. No skip days. Streak: {streak}.`,
    `{habitIcon} {habitName}. Execute.`,
    `{habitName} is waiting. Stop scrolling and handle it.`,
  ],

  // ── Playful ───────────────────────────────────────────
  'playful-gentle': [
    `Your {habitName} habit is giving you puppy eyes {habitIcon}`,
    `{habitIcon} {habitName} just asked if you forgot about it. You didn't, right?`,
    `Plot twist: {habitName} is still on your list today {habitIcon}`,
    `{habitIcon} {habitName} called — it misses you already.`,
  ],
  'playful-honest': [
    `{habitIcon} {habitName}: day {streak} of your streak. Don't ghost it now.`,
    `Your {habitName} streak ({streak} days) would really prefer you showed up today {habitIcon}`,
    `{habitIcon} {habitName} check: are we doing this or what?`,
    `{streak} days of {habitName} and counting. Don't ruin the plot {habitIcon}`,
  ],
  'playful-tough': [
    `{habitIcon} {habitName}. Your {streak}-day streak is watching. Don't disappoint it.`,
    `Hey, {habitName} isn't going to complete itself. Chop chop {habitIcon}`,
    `{habitIcon} {habitName}. You've done {streak} days straight. Quitting now would be a terrible plot twist.`,
    `{habitName} time. Less thinking, more doing {habitIcon}`,
  ],

  // ── Neutral ───────────────────────────────────────────
  'neutral-gentle': [
    `{habitIcon} Scheduled reminder: {habitName}.`,
    `{habitName} is on today's list.`,
    `{habitIcon} {habitName} — daily reminder.`,
    `Reminder: {habitName} ({streak}-day streak).`,
  ],
  'neutral-honest': [
    `{habitIcon} {habitName}. Current streak: {streak} days.`,
    `Daily check-in: {habitName}. Streak: {streak}.`,
    `{habitIcon} {habitName} is due today. Status: pending.`,
    `{habitName} — day {streak} of your current streak.`,
  ],
  'neutral-tough': [
    `{habitIcon} {habitName}. Streak: {streak}. Completion required.`,
    `{habitName} has not been logged today.`,
    `{habitIcon} {habitName}: pending. Streak at risk: {streak} days.`,
    `{habitName} — not yet completed. Streak: {streak}.`,
  ],
};

/**
 * Get a personality-aware reminder message.
 * 
 * @param {Object} habit       - { name, icon, stats }
 * @param {Object} personality - { tone, accountability } (from user's aiPersonality)
 * @returns {string} The interpolated reminder message
 */
function getReminderMessage(habit, personality = {}) {
  const tone = personality.tone || 'warm';
  const accountability = personality.accountability || 'gentle';
  const key = `${tone}-${accountability}`;

  const templates = reminderMessages[key] || reminderMessages['warm-gentle'];
  const template = templates[Math.floor(Math.random() * templates.length)];

  const streak = habit.stats?.currentStreak || 0;

  return template
    .replace(/\{habitName\}/g, habit.name)
    .replace(/\{habitIcon\}/g, habit.icon || '🎯')
    .replace(/\{streak\}/g, String(streak));
}

module.exports = { reminderMessages, getReminderMessage };
