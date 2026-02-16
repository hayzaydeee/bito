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

    const baseUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', sans-serif; color: #333; max-width: 520px; margin: 0 auto; padding: 20px; background: #f8fafc; }
          .card { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
          .logo { font-size: 32px; text-align: center; margin-bottom: 4px; }
          .brand { text-align: center; font-size: 24px; font-weight: 700; color: #1e1b4b; margin: 0 0 24px; }
          .message { color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 28px; }
          .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
          .tips { margin-top: 28px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
          .tip { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; color: #64748b; font-size: 14px; }
          .tip-icon { flex-shrink: 0; font-size: 18px; }
          .footer { text-align: center; margin-top: 28px; color: #94a3b8; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">🎯</div>
          <h1 class="brand">Welcome to Bito</h1>
          <p class="message">${message}</p>
          <div style="text-align: center;">
            <a href="${baseUrl}/app/dashboard" class="btn">Set Up Your First Habit →</a>
          </div>
          <div class="tips">
            <div class="tip"><span class="tip-icon">✨</span><span>Start small — even 1 habit tracked daily builds momentum</span></div>
            <div class="tip"><span class="tip-icon">⏰</span><span>Set reminders so you never forget</span></div>
            <div class="tip"><span class="tip-icon">📊</span><span>Check your analytics to see patterns over time</span></div>
            <div class="tip"><span class="tip-icon">👥</span><span>Invite friends to a workspace for accountability</span></div>
          </div>
        </div>
        <p class="footer">
          You're receiving this because you just signed up for <a href="${baseUrl}" style="color: #6366f1;">Bito</a>.<br>
          <a href="${baseUrl}/app/settings" style="color: #6366f1;">Manage email preferences</a>
        </p>
      </body>
      </html>
    `;

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
