/**
 * Welcome Email Service
 *
 * Sends a personalized AI-generated welcome email when a new user signs up.
 * Non-blocking (fire-and-forget) so it never delays the signup response.
 *
 * Uses:
 *  - OpenAI (gpt-4o-mini) for a warm, personalized greeting
 *  - Resend (via emailService) for delivery
 */

const emailService = require('./emailService');
const { baseLayout, button, infoCard, BRAND } = require('./emailTemplates');

// Lazy import to share the singleton client from llmEnrichment
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

/**
 * Generate a short welcome message with AI.
 * Falls back to a static message if OpenAI is unavailable.
 */
async function generateWelcomeMessage(name) {
  const client = getOpenAIClient();
  if (!client) return getStaticWelcome(name);

  try {
    const model = process.env.INSIGHTS_LLM_MODEL || 'gpt-4o-mini';
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You write short, warm welcome emails for Bito — a habit-tracking app that helps people build better routines. ' +
            'Keep it to 2-3 sentences. Be encouraging but not cheesy. Do NOT include a subject line — just the body paragraph. ' +
            'Address the user by first name. End with a motivating nudge to set up their first habit.',
        },
        {
          role: 'user',
          content: `Write a welcome message for a new user named "${name}".`,
        },
      ],
      temperature: 0.8,
      max_tokens: 150,
    });

    return completion.choices[0]?.message?.content?.trim() || getStaticWelcome(name);
  } catch (err) {
    console.warn('📧 AI welcome generation failed, using static:', err.message);
    return getStaticWelcome(name);
  }
}

function getStaticWelcome(name) {
  return `Welcome to Bito, ${name}! We're excited to have you. The best way to get started is to create your first habit — it only takes a few seconds, and you'll be on your way to building the routines that matter most to you.`;
}

/**
 * Send the welcome email. Fire-and-forget — never throws to caller.
 */
async function sendWelcomeEmail(user) {
  try {
    const firstName = (user.name || 'there').split(' ')[0];
    const message = await generateWelcomeMessage(firstName);

    const tips = [
      { icon: '✨', text: 'Start small — even 1 habit tracked daily builds momentum' },
      { icon: '⏰', text: 'Set reminders so you never forget' },
      { icon: '📊', text: 'Check your analytics to see patterns over time' },
      { icon: '👥', text: 'Invite friends to a workspace for accountability' },
    ];

    const tipsHtml = tips.map(t => `
      <tr>
        <td style="padding:8px 0;font-family:${BRAND.fonts};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:top;padding-right:12px;font-size:18px;line-height:1;">${t.icon}</td>
              <td style="font-size:14px;color:${BRAND.colors.textSecondary};line-height:1.5;">${t.text}</td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('');

    const body = `
      <p style="font-size:16px;color:${BRAND.colors.textSecondary};line-height:1.7;margin:0 0 28px 0;">
        ${message}
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding:0 0 32px 0;">
            ${button('Set Up Your First Habit →', `${BRAND.url}/app/dashboard`)}
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${BRAND.colors.border};padding-top:24px;">
        <tr>
          <td style="padding-top:24px;">
            <h2 style="font-family:${BRAND.fonts};font-size:15px;font-weight:700;color:${BRAND.colors.text};margin:0 0 16px 0;">Quick tips to get started</h2>
          </td>
        </tr>
        ${tipsHtml}
      </table>
    `;

    const html = baseLayout({
      preheader: `Welcome to Bito, ${firstName}! Set up your first habit and start building momentum today.`,
      heading: `Welcome to Bito, ${firstName}!`,
      headingEmoji: '👋',
      body,
      footerNote: `You're receiving this because you just signed up for Bito.`,
    });

    await emailService.sendMail({
      to: user.email,
      subject: `🎯 Welcome to Bito, ${firstName}!`,
      html,
    });

    console.log(`📧 Welcome email sent to ${user.email}`);
  } catch (err) {
    // Never let welcome email failure affect signup
    console.error('📧 Welcome email failed (non-blocking):', err.message);
  }
}

module.exports = { sendWelcomeEmail };
