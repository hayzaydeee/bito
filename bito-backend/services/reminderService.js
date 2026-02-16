const cron = require('node-cron');
const webPush = require('web-push');
const Habit = require('../models/Habit');
const HabitEntry = require('../models/HabitEntry');
const User = require('../models/User');
const PushSubscription = require('../models/PushSubscription');
const emailService = require('./emailService');
const { getReminderMessage } = require('../prompts/reminderMessages');

/**
 * ReminderService — runs a cron job every minute to check for
 * habits that have reminders due NOW and haven't been completed today.
 *
 * Flow:
 * 1. Find all habits where schedule.reminderEnabled = true
 * 2. Group by user, check their timezone
 * 3. If the user's local time matches reminderTime (HH:MM), send notification
 * 4. Skip if today's entry is already completed
 * 5. Send push (primary) or email (fallback)
 */
class ReminderService {
  constructor() {
    this.job = null;
    this.lastRun = null;
    this.sentToday = new Set(); // "userId_habitId_date" keys to avoid duplicates
  }

  start() {
    // Run every minute
    this.job = cron.schedule('* * * * *', () => this.checkReminders(), {
      timezone: 'UTC',
    });
    console.log('⏰ Reminder cron job started (every minute)');

    // Clear sentToday set at midnight UTC
    cron.schedule('0 0 * * *', () => {
      this.sentToday.clear();
      console.log('⏰ Cleared daily reminder dedup set');
    }, { timezone: 'UTC' });
  }

  stop() {
    if (this.job) {
      this.job.stop();
      console.log('⏰ Reminder cron job stopped');
    }
  }

  async checkReminders() {
    try {
      this.lastRun = new Date();

      // Find all habits with reminders enabled
      const habits = await Habit.find({
        'schedule.reminderEnabled': true,
        'schedule.reminderTime': { $exists: true, $ne: '' },
        isActive: true,
        isArchived: { $ne: true },
      }).lean();

      if (!habits.length) return;

      // Group habits by user for efficient processing
      const byUser = {};
      for (const habit of habits) {
        const uid = habit.userId.toString();
        if (!byUser[uid]) byUser[uid] = [];
        byUser[uid].push(habit);
      }

      // Process each user
      const userIds = Object.keys(byUser);
      const users = await User.find({ _id: { $in: userIds }, isActive: true }).lean();

      for (const user of users) {
        const uid = user._id.toString();
        const userHabits = byUser[uid];
        if (!userHabits) continue;

        // Get user's local time
        const tz = user.preferences?.timezone || 'UTC';
        const nowLocal = this._getLocalTime(tz);
        const nowHHMM = `${String(nowLocal.getHours()).padStart(2, '0')}:${String(nowLocal.getMinutes()).padStart(2, '0')}`;
        const todayStr = this._formatDate(nowLocal);
        const dayOfWeek = nowLocal.getDay(); // 0=Sun

        // Check each habit
        for (const habit of userHabits) {
          const key = `${uid}_${habit._id}_${todayStr}`;

          // Already sent today?
          if (this.sentToday.has(key)) continue;

          // Time match? (compare HH:MM)
          if (habit.schedule.reminderTime !== nowHHMM) continue;

          // Scheduled for today?
          if (habit.schedule.days?.length && !habit.schedule.days.includes(dayOfWeek)) continue;

          // Already completed today?
          const entry = await HabitEntry.findOne({
            habitId: habit._id,
            date: todayStr,
            completed: true,
          }).lean();
          if (entry) continue;

          // Send reminder!
          this.sentToday.add(key);
          await this._sendReminder(user, habit);
        }
      }
    } catch (error) {
      console.error('⏰ Reminder check error:', error.message);
    }
  }

  async _sendReminder(user, habit) {
    const payload = {
      title: `${habit.icon || '🎯'} ${habit.name}`,
      body: getReminderMessage(habit, user.aiPersonality),
      icon: '/android-chrome-192x192.png',
      badge: '/favicon-32x32.png',
      tag: `reminder-${habit._id}`,
      data: { url: '/app/dashboard', habitId: habit._id.toString() },
    };

    let pushSent = false;

    // Try push notifications first
    if (user.preferences?.pushNotifications) {
      const subs = await PushSubscription.find({
        userId: user._id,
        isActive: true,
      });

      for (const sub of subs) {
        try {
          await webPush.sendNotification(sub.subscription, JSON.stringify(payload));
          sub.lastUsed = new Date();
          sub.failCount = 0;
          await sub.save();
          pushSent = true;
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await PushSubscription.deleteOne({ _id: sub._id });
          } else {
            sub.failCount += 1;
            await sub.save();
          }
        }
      }
    }

    // Fallback to email if push failed or not enabled
    if (!pushSent && user.preferences?.emailNotifications) {
      try {
        await this._sendReminderEmail(user, habit);
      } catch (err) {
        console.error(`⏰ Email reminder failed for ${user.email}:`, err.message);
      }
    }

    console.log(`⏰ Reminder sent: "${habit.name}" → ${user.email} (push: ${pushSent})`);
  }

  async _sendReminderEmail(user, habit) {
    if (!emailService.transporter) return;

    const baseUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Bito" <noreply@bito.app>',
      to: user.email,
      subject: `${habit.icon || '🎯'} Reminder: ${habit.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', sans-serif; color: #333; max-width: 480px; margin: 0 auto; padding: 20px; background: #f8fafc; }
            .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
            .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px; }
            .footer { text-align: center; margin-top: 24px; color: #94a3b8; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="card">
            <p style="font-size: 28px; margin: 0 0 8px;">${habit.icon || '🎯'}</p>
            <h2 style="margin: 0 0 8px; color: #1e1b4b;">Time for: ${habit.name}</h2>
            <p style="color: #64748b; margin: 0 0 20px;">
              Don't break your streak! Take a moment to complete this habit today.
            </p>
            <a href="${baseUrl}/app/dashboard" class="btn">Open Bito →</a>
          </div>
          <p class="footer">
            You're receiving this because you enabled reminders for "${habit.name}" on Bito.<br>
            <a href="${baseUrl}/app/settings" style="color: #6366f1;">Manage notification preferences</a>
          </p>
        </body>
        </html>
      `,
    };

    await emailService.transporter.sendMail(mailOptions);
  }

  // Legacy fallback — kept for backwards compatibility but no longer primary
  _getReminderMessage(habit) {
    return getReminderMessage(habit, {});
  }

  _getLocalTime(timezone) {
    try {
      const now = new Date();
      const str = now.toLocaleString('en-US', { timeZone: timezone });
      return new Date(str);
    } catch {
      return new Date();
    }
  }

  _formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

module.exports = new ReminderService();
