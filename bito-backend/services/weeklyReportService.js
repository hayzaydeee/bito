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
const { baseLayout, button, buttonSecondary, statPill, infoCard, sectionTitle, BRAND } = require('./emailTemplates');
const { buildSystemPrompt, getTemperature, DEFAULT_PERSONALITY } = require('../prompts/buildSystemPrompt');

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

  /**
   * Send a report immediately for a specific user (bypasses day/time/dedup checks).
   * Used for testing via the API.
   */
  async sendNow(userId) {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    const tz = user.preferences?.timezone || 'UTC';
    const localNow = this._getLocalTime(tz);

    const endDate = new Date(localNow);
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);

    const startStr = this._formatDate(startDate);
    const endStr = this._formatDate(endDate);

    const [periodStats, habits, entries] = await Promise.all([
      HabitEntry.getUserStatsForPeriod(user._id, startStr, endStr),
      Habit.find({ userId: user._id, isActive: true, isArchived: { $ne: true } }).lean(),
      HabitEntry.find({
        userId: user._id,
        date: { $gte: new Date(startStr), $lte: new Date(endStr) },
      }).lean(),
    ]);

    if (!habits.length) throw new Error('No active habits found — nothing to report');

    const habitBreakdown = this._buildHabitBreakdown(habits, entries);
    const aiInsights = await this._generateInsights(user, periodStats, habitBreakdown);

    await this._sendReport(user, {
      startDate: startStr,
      endDate: endStr,
      periodStats,
      habitBreakdown,
      aiInsights,
    });

    return { startDate: startStr, endDate: endStr, habitsIncluded: habits.length };
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

      const personality = user.aiPersonality || DEFAULT_PERSONALITY;
      const systemPrompt = buildSystemPrompt(personality, 'weekly-report');
      const temperature = getTemperature(personality);

      const habitSummary = habitBreakdown
        .map((h) => `- ${h.icon} ${h.name}: ${h.completed}/7 days (${h.rate}%), streak: ${h.currentStreak}`)
        .join('\n');

      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
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
        temperature,
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

    const overallRate = periodStats.totalEntries > 0
      ? Math.round((periodStats.completedEntries / periodStats.totalEntries) * 100)
      : 0;

    // Format date range
    const fmtDate = (d) => {
      const dt = new Date(d);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const dateRange = `${fmtDate(startDate)} – ${fmtDate(endDate)}`;

    // Build habit rows HTML (table-based)
    const habitRows = habitBreakdown
      .sort((a, b) => b.rate - a.rate)
      .map((h) => {
        const barColor = h.rate >= 80 ? BRAND.colors.success : h.rate >= 50 ? BRAND.colors.warning : BRAND.colors.danger;
        const streakText = h.currentStreak > 0 ? `🔥 ${h.currentStreak}d` : '';
        return `
          <tr>
            <td style="padding:12px 14px;border-bottom:1px solid ${BRAND.colors.border};font-family:${BRAND.fonts};">
              <span style="font-size:18px;margin-right:8px;vertical-align:middle;">${h.icon}</span>
              <span style="font-weight:600;color:${BRAND.colors.text};font-size:14px;vertical-align:middle;">${h.name}</span>
            </td>
            <td style="padding:12px 14px;border-bottom:1px solid ${BRAND.colors.border};text-align:center;font-family:${BRAND.fonts};">
              <!--[if mso]>
              <span style="font-size:13px;color:${BRAND.colors.textMuted};">${h.rate}%</span>
              <![endif]-->
              <!--[if !mso]><!-->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;vertical-align:middle;">
                <tr>
                  <td style="width:70px;height:8px;background:${BRAND.colors.border};border-radius:99px;overflow:hidden;">
                    <div style="width:${Math.min(h.rate, 100)}%;height:8px;background:${barColor};border-radius:99px;"></div>
                  </td>
                  <td style="padding-left:8px;font-size:13px;color:${BRAND.colors.textMuted};font-family:${BRAND.fonts};white-space:nowrap;">${h.rate}%</td>
                </tr>
              </table>
              <!--<![endif]-->
            </td>
            <td style="padding:12px 14px;border-bottom:1px solid ${BRAND.colors.border};text-align:right;font-size:13px;color:${BRAND.colors.textMuted};font-family:${BRAND.fonts};white-space:nowrap;">
              ${streakText}
            </td>
          </tr>
        `;
      })
      .join('');

    // Stats row
    const statsHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;width:auto;">
        <tr>
          ${statPill(`${overallRate}%`, 'Completion')}
          ${statPill(periodStats.completedEntries, 'Check-ins')}
          ${periodStats.averageMood ? statPill(periodStats.averageMood.toFixed(1), 'Avg Mood') : ''}
        </tr>
      </table>
    `;

    // AI insights card
    const insightsHtml = infoCard(
      `<strong style="color:${BRAND.colors.primaryDark};font-size:13px;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:6px;">✨ AI Insights</strong>` +
      `<span style="color:${BRAND.colors.textSecondary};font-size:14px;line-height:1.7;">${aiInsights}</span>`,
      { bgColor: BRAND.colors.primaryLight, borderColor: BRAND.colors.primary }
    );

    const body = `
      <p style="font-size:15px;color:${BRAND.colors.textSecondary};margin:0 0 24px 0;line-height:1.6;">
        Hey ${firstName}, here's how your week went:
      </p>

      ${statsHtml}

      ${insightsHtml}

      ${sectionTitle('Habit Breakdown')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        ${habitRows}
      </table>

      ${(!user.personalityPromptDismissed && !user.personalityCustomized) ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr>
          <td style="padding:16px 20px;border-top:1px solid ${BRAND.colors.border};font-family:${BRAND.fonts};">
            <p style="font-size:13px;color:${BRAND.colors.textSecondary};margin:0 0 12px 0;line-height:1.5;">
              We set Bito's voice based on your goals. Was the tone right for you?
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-right:8px;">
                  ${buttonSecondary('Customise my Bito voice', `${BRAND.url}/app/settings/personality`)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      ` : ''}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding:8px 0 0 0;">
            ${button('View Full Analytics →', `${BRAND.url}/app/analytics`)}
          </td>
        </tr>
      </table>
    `;

    const html = baseLayout({
      preheader: `${overallRate}% completion this week — ${periodStats.completedEntries} check-ins from ${dateRange}`,
      heading: 'Your Weekly Report',
      headingEmoji: '📊',
      body,
      footerNote: `Report for ${dateRange} &middot; You're receiving this because email notifications are on.`,
    });

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
