/**
 * Weekly Report Service
 *
 * Sends an AI-enriched weekly habit report to every active user.
 * Runs a cron job that fires each hour and checks if it's 9AM in the
 * user's timezone ON their configured week-start day.
 *
 * Data flow:
 *  1. Cron fires hourly (at :00)
 *  2. Find users where emailNotifications=true
 *  3. For each user, check if local time is ~09:00 on their weekStartsOn day
 *  4. Gather last week's habit data (entries, streaks, mood)
 *  5. Feed to OpenAI for personalized insights
 *  6. Render styled HTML email + send via Resend
 */

const cron = require('node-cron');
const Habit = require('../models/Habit');
const HabitEntry = require('../models/HabitEntry');
const User = require('../models/User');
const emailService = require('./emailService');

// ── OpenAI client (shared lazy singleton) ──────────────────
let _openaiClient = null;
function getOpenAIClient() {
  if (_openaiClient) return _openaiClient;
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const OpenAIModule = require('openai');
    const OpenAI = OpenAIModule.default || OpenAIModule.OpenAI || OpenAIModule;
    _openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      ...(process.env.OPENAI_BASE_URL && { baseURL: process.env.OPENAI_BASE_URL }),
    });
    return _openaiClient;
  } catch {
    return null;
  }
}

class WeeklyReportService {
  constructor() {
    this.job = null;
    this.sentThisWeek = new Set(); // "userId_weekKey" dedup
  }

  start() {
    // Run at the top of every hour
    this.job = cron.schedule('0 * * * *', () => this.checkAndSend(), {
      timezone: 'UTC',
    });
    console.log('📊 Weekly report cron started (hourly check)');

    // Clear dedup set every Monday at midnight UTC
    // (safe buffer — users get reports on their own weekStartsOn day)
    cron.schedule('0 0 * * 1', () => {
      this.sentThisWeek.clear();
      console.log('📊 Cleared weekly report dedup set');
    }, { timezone: 'UTC' });
  }

  stop() {
    if (this.job) {
      this.job.stop();
      console.log('📊 Weekly report cron stopped');
    }
  }

  async checkAndSend() {
    try {
      // Find all active users who want email notifications
      const users = await User.find({
        isActive: true,
        'preferences.emailNotifications': true,
      }).lean();

      if (!users.length) return;

      for (const user of users) {
        try {
          await this._processUser(user);
        } catch (err) {
          console.error(`📊 Weekly report error for ${user.email}:`, err.message);
        }
      }
    } catch (err) {
      console.error('📊 Weekly report cron error:', err.message);
    }
  }

  async _processUser(user) {
    const tz = user.preferences?.timezone || 'UTC';
    const weekStartsOn = user.preferences?.weekStartsOn ?? 1; // 0=Sun, 1=Mon default

    // Get user's local time
    const localNow = this._getLocalTime(tz);
    const localHour = localNow.getHours();
    const localDay = localNow.getDay(); // 0=Sun

    // Only send at 9AM on the user's week-start day
    if (localDay !== weekStartsOn || localHour !== 9) return;

    // Dedup — one report per user per ISO week
    const weekKey = this._getWeekKey(localNow);
    const dedupKey = `${user._id}_${weekKey}`;
    if (this.sentThisWeek.has(dedupKey)) return;

    // Gather data for the PREVIOUS week (7 days ending yesterday)
    const endDate = new Date(localNow);
    endDate.setDate(endDate.getDate() - 1); // yesterday
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6); // 7 days total

    const startStr = this._formatDate(startDate);
    const endStr = this._formatDate(endDate);

    // Get stats
    const [periodStats, habits, entries] = await Promise.all([
      HabitEntry.getUserStatsForPeriod(user._id, startStr, endStr),
      Habit.find({ userId: user._id, isActive: true, isArchived: { $ne: true } }).lean(),
      HabitEntry.find({
        userId: user._id,
        date: { $gte: new Date(startStr), $lte: new Date(endStr) },
      }).lean(),
    ]);

    // Skip if user has no habits (new user, nothing to report)
    if (!habits.length) return;

    // Build per-habit breakdown
    const habitBreakdown = this._buildHabitBreakdown(habits, entries);

    // Generate AI insights
    const aiInsights = await this._generateInsights(user, periodStats, habitBreakdown);

    // Send the email
    await this._sendReport(user, {
      startDate: startStr,
      endDate: endStr,
      periodStats,
      habitBreakdown,
      aiInsights,
    });

    this.sentThisWeek.add(dedupKey);
    console.log(`📊 Weekly report sent to ${user.email}`);
  }

  _buildHabitBreakdown(habits, entries) {
    return habits.map((habit) => {
      const habitEntries = entries.filter(
        (e) => e.habitId.toString() === habit._id.toString()
      );
      const completed = habitEntries.filter((e) => e.completed).length;
      const total = habitEntries.length;
      const moods = habitEntries.filter((e) => e.mood).map((e) => e.mood);
      const avgMood = moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : null;

      return {
        name: habit.name,
        icon: habit.icon || '🎯',
        category: habit.category || 'General',
        completed,
        total,
        rate: total > 0 ? Math.round((completed / 7) * 100) : 0, // out of 7 days
        currentStreak: habit.stats?.currentStreak || 0,
        longestStreak: habit.stats?.longestStreak || 0,
        avgMood,
      };
    });
  }

  async _generateInsights(user, stats, habitBreakdown) {
    const client = getOpenAIClient();
    if (!client) return this._getStaticInsights(stats, habitBreakdown);

    try {
      const firstName = (user.name || 'there').split(' ')[0];
      const model = process.env.INSIGHTS_LLM_MODEL || 'gpt-4o-mini';

      const habitSummary = habitBreakdown
        .map((h) => `- ${h.icon} ${h.name}: ${h.completed}/7 days (${h.rate}%), streak: ${h.currentStreak}`)
        .join('\n');

      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You write concise, insightful weekly habit report summaries for Bito. ' +
              'Analyze the data and provide:\n' +
              '1. A 1-sentence highlight (the best thing from the week)\n' +
              '2. A 1-sentence area for improvement\n' +
              '3. One specific, actionable tip for next week\n\n' +
              'Be warm, data-driven, and specific. Reference actual habit names and numbers. ' +
              'Keep the total under 100 words. Do NOT use markdown headers or bullet points — use plain paragraph text.',
          },
          {
            role: 'user',
            content:
              `Weekly report for ${firstName}:\n` +
              `Overall: ${stats.completedEntries}/${stats.totalEntries} entries completed` +
              (stats.averageMood ? `, avg mood: ${stats.averageMood.toFixed(1)}/5` : '') +
              `\n\nHabits:\n${habitSummary}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      return completion.choices[0]?.message?.content?.trim() || this._getStaticInsights(stats, habitBreakdown);
    } catch (err) {
      console.warn('📊 AI insights generation failed:', err.message);
      return this._getStaticInsights(stats, habitBreakdown);
    }
  }

  _getStaticInsights(stats, habitBreakdown) {
    const rate = stats.totalEntries > 0
      ? Math.round((stats.completedEntries / stats.totalEntries) * 100)
      : 0;

    const bestHabit = habitBreakdown.reduce((best, h) => (h.rate > (best?.rate || 0) ? h : best), null);
    const worstHabit = habitBreakdown.reduce((worst, h) => (h.rate < (worst?.rate || 100) ? h : worst), null);

    let text = `You completed ${rate}% of your habit check-ins this week. `;
    if (bestHabit) text += `${bestHabit.icon} ${bestHabit.name} was your strongest habit at ${bestHabit.rate}%. `;
    if (worstHabit && worstHabit.name !== bestHabit?.name) {
      text += `Try focusing on ${worstHabit.icon} ${worstHabit.name} next week — consistency builds momentum.`;
    }
    return text;
  }

  async _sendReport(user, data) {
    const { startDate, endDate, periodStats, habitBreakdown, aiInsights } = data;
    const firstName = (user.name || 'there').split(' ')[0];
    const baseUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

    const overallRate = periodStats.totalEntries > 0
      ? Math.round((periodStats.completedEntries / periodStats.totalEntries) * 100)
      : 0;

    // Build habit rows HTML
    const habitRows = habitBreakdown
      .sort((a, b) => b.rate - a.rate)
      .map((h) => {
        const barColor = h.rate >= 80 ? '#22c55e' : h.rate >= 50 ? '#f59e0b' : '#ef4444';
        const streakText = h.currentStreak > 0 ? `🔥 ${h.currentStreak}d streak` : '';
        return `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">
              <span style="font-size: 18px; margin-right: 6px;">${h.icon}</span>
              <span style="font-weight: 600; color: #1e1b4b;">${h.name}</span>
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center;">
              <div style="background: #f1f5f9; border-radius: 99px; height: 8px; width: 80px; display: inline-block; vertical-align: middle;">
                <div style="background: ${barColor}; border-radius: 99px; height: 8px; width: ${Math.min(h.rate, 100)}%;"></div>
              </div>
              <span style="margin-left: 8px; font-size: 13px; color: #64748b;">${h.rate}%</span>
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; color: #94a3b8;">
              ${streakText}
            </td>
          </tr>
        `;
      })
      .join('');

    // Format date range
    const fmtDate = (d) => {
      const dt = new Date(d);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const dateRange = `${fmtDate(startDate)} – ${fmtDate(endDate)}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', sans-serif; color: #333; max-width: 560px; margin: 0 auto; padding: 20px; background: #f8fafc; }
          .card { background: white; border-radius: 16px; padding: 36px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { font-size: 28px; }
          .brand { font-size: 22px; font-weight: 700; color: #1e1b4b; margin: 4px 0 0; }
          .date-range { color: #94a3b8; font-size: 14px; margin-top: 4px; }
          .stats-row { display: flex; justify-content: center; gap: 24px; margin: 20px 0 24px; text-align: center; }
          .stat { flex: 1; }
          .stat-value { font-size: 28px; font-weight: 700; color: #1e1b4b; }
          .stat-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
          .insights { background: linear-gradient(135deg, #ede9fe, #e0e7ff); border-radius: 12px; padding: 20px; margin: 20px 0; }
          .insights-title { font-size: 14px; font-weight: 600; color: #4338ca; margin: 0 0 8px; }
          .insights-text { font-size: 14px; color: #334155; line-height: 1.6; margin: 0; }
          .section-title { font-size: 15px; font-weight: 700; color: #1e1b4b; margin: 24px 0 12px; }
          table { width: 100%; border-collapse: collapse; }
          .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
          .footer { text-align: center; margin-top: 28px; color: #94a3b8; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">📊</div>
            <h1 class="brand">Your Weekly Report</h1>
            <p class="date-range">${dateRange}</p>
          </div>

          <p style="color: #475569; font-size: 15px; margin: 0 0 20px;">
            Hey ${firstName}, here's how your week went:
          </p>

          <!-- Stats overview -->
          <!--[if mso]><table><tr><td><![endif]-->
          <div style="text-align: center;">
            <table style="margin: 0 auto; width: auto;">
              <tr>
                <td style="padding: 0 16px; text-align: center;">
                  <div class="stat-value">${overallRate}%</div>
                  <div class="stat-label">Completion</div>
                </td>
                <td style="padding: 0 16px; text-align: center;">
                  <div class="stat-value">${periodStats.completedEntries}</div>
                  <div class="stat-label">Check-ins</div>
                </td>
                ${periodStats.averageMood ? `
                <td style="padding: 0 16px; text-align: center;">
                  <div class="stat-value">${periodStats.averageMood.toFixed(1)}</div>
                  <div class="stat-label">Avg Mood</div>
                </td>
                ` : ''}
              </tr>
            </table>
          </div>
          <!--[if mso]></td></tr></table><![endif]-->

          <!-- AI Insights -->
          <div class="insights">
            <p class="insights-title">✨ AI Insights</p>
            <p class="insights-text">${aiInsights}</p>
          </div>

          <!-- Habit breakdown -->
          <p class="section-title">Habit Breakdown</p>
          <table>
            ${habitRows}
          </table>

          <div style="text-align: center; margin-top: 28px;">
            <a href="${baseUrl}/app/analytics" class="btn">View Full Analytics →</a>
          </div>
        </div>

        <p class="footer">
          You're receiving this because you have email notifications enabled on <a href="${baseUrl}" style="color: #6366f1;">Bito</a>.<br>
          <a href="${baseUrl}/app/settings" style="color: #6366f1;">Manage email preferences</a>
        </p>
      </body>
      </html>
    `;

    await emailService.sendMail({
      to: user.email,
      subject: `📊 Your Week in Review — ${overallRate}% completion (${dateRange})`,
      html,
    });
  }

  // ── Helpers ─────────────────────────────────────────────
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

  _getWeekKey(date) {
    // ISO week-ish key: "2026-W07"
    const jan1 = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - jan1) / 86400000);
    const week = Math.ceil((days + jan1.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
  }
}

module.exports = new WeeklyReportService();
