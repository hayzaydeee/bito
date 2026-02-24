const { Resend } = require('resend');
const { baseLayout, button, infoCard, BRAND } = require('./emailTemplates');

class EmailService {
  constructor() {
    // Expose a transporter-like interface so existing code
    // (reminderService, workspace invites) keeps working.
    this.transporter = null;
    this.resend = null;
    this.init();
  }

  init() {
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey) {
      this.resend = new Resend(apiKey);

      // Provide a nodemailer-compatible .transporter so callers that do
      // `emailService.transporter.sendMail(opts)` still work.
      this.transporter = {
        sendMail: (opts) => this.sendMail(opts),
      };

      console.log('📧 Resend email service initialized');
    } else {
      console.warn('⚠️  RESEND_API_KEY not set — emails will be logged to console');
      this.transporter = {
        sendMail: async (mailOptions) => {
          console.log('📧 EMAIL WOULD BE SENT:');
          console.log('To:', mailOptions.to);
          console.log('Subject:', mailOptions.subject);
          return { messageId: 'console-' + Date.now() };
        },
      };
    }
  }

  /**
   * Send an email via Resend HTTP API.
   * Accepts nodemailer-style { from, to, subject, html } options.
   */
  async sendMail(mailOptions) {
    if (!this.resend) {
      return this.transporter.sendMail(mailOptions);
    }

    // Parse "from" — Resend needs a verified domain sender.
    // Default to onboarding@resend.dev (works on free tier for testing).
    const from = process.env.EMAIL_FROM || 'Bito <onboarding@resend.dev>';

    const { data, error } = await this.resend.emails.send({
      from,
      to: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
      subject: mailOptions.subject,
      html: mailOptions.html,
    });

    if (error) {
      console.error('❌ Resend email error:', error);
      throw new Error(error.message || 'Resend email failed');
    }

    console.log('📧 Email sent via Resend:', data.id, '→', mailOptions.to);
    return { messageId: data.id };
  }

  async sendMagicLinkEmail(user, magicLinkUrl) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    const greeting = user.name
      ? `<p style="font-size:15px;color:${BRAND.colors.textSecondary};margin:0 0 20px 0;line-height:1.7;">
          Hi <strong style="color:${BRAND.colors.text};">${user.name}</strong>,
        </p>`
      : '';

    const body = `
      ${greeting}

      <p style="font-size:15px;color:${BRAND.colors.textSecondary};margin:0 0 20px 0;line-height:1.7;">
        Click the button below to sign in to Bito. No password needed.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding:8px 0 28px 0;">
            ${button('Sign in to Bito', magicLinkUrl)}
          </td>
        </tr>
      </table>

      ${infoCard(
        '<strong>This link expires in 15 minutes</strong> and can only be used once. If you didn\'t request this, you can safely ignore this email.'
      )}

      <p style="font-size:13px;color:${BRAND.colors.textMuted};margin:20px 0 0 0;line-height:1.6;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${magicLinkUrl}" style="color:${BRAND.colors.primary};word-break:break-all;">${magicLinkUrl}</a>
      </p>
    `;

    const html = baseLayout({
      preheader: 'Your Bito sign-in link — expires in 15 minutes.',
      heading: 'Sign In to Bito',
      headingEmoji: '✨',
      body,
      footerNote: 'You received this email because a sign-in was requested for your account.',
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Divine Eze" <noreply@bito.app>',
      to: user.email,
      subject: 'Your Bito sign-in link',
      html,
    };

    try {
      const info = await this.sendMail(mailOptions);
      console.log('📧 Magic link email sent to:', mailOptions.to);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send magic link email:', error);
      throw error;
    }
  }

  async sendInvitationEmail(invitation, workspace, invitedBy) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    // Get base URL and normalize to remove www
    let baseUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    baseUrl = baseUrl.replace('://www.', '://'); // Remove www if present
    
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Divine Eze" <noreply@bito.app>',
      to: invitation.email,
      subject: `You're invited to join "${workspace.name}" on Bito`,
      html: this.generateInvitationHTML(invitation, workspace, invitedBy, inviteUrl)
    };

    try {
      const info = await this.sendMail(mailOptions);
      console.log('📧 Invitation email sent to:', mailOptions.to);
      
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('❌ Failed to send invitation email:', error);
      throw error;
    }
  }

  generateInvitationHTML(invitation, workspace, invitedBy, inviteUrl) {
    const features = [
      { icon: '📊', text: 'Track your personal habits within the team workspace' },
      { icon: '👥', text: 'See team progress and celebrate achievements together' },
      { icon: '🎯', text: 'Adopt workspace habit templates or create your own' },
      { icon: '🏆', text: 'Participate in team challenges and leaderboards' },
    ];

    const featuresHtml = features.map(f => `
      <tr>
        <td style="padding:6px 0;font-family:${BRAND.fonts};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:top;padding-right:10px;font-size:16px;line-height:1;">${f.icon}</td>
              <td style="font-size:14px;color:${BRAND.colors.textSecondary};line-height:1.5;">${f.text}</td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('');

    const messageCard = invitation.message
      ? infoCard(
          `<strong style="display:block;margin-bottom:4px;">Personal message from ${invitedBy.name}:</strong>"${invitation.message}"`,
          { borderColor: BRAND.colors.accent, bgColor: '#f5f3ff' }
        )
      : '';

    const body = `
      <p style="font-size:15px;color:${BRAND.colors.textSecondary};margin:0 0 20px 0;line-height:1.7;">
        <strong style="color:${BRAND.colors.text};">${invitedBy.name}</strong> has invited you to join
        <strong style="color:${BRAND.colors.primary};">${workspace.name}</strong> on Bito, where teams track habits together and support each other's growth.
      </p>

      ${messageCard}

      <p style="font-size:14px;color:${BRAND.colors.textSecondary};margin:20px 0 12px 0;line-height:1.6;">
        As a <strong style="color:${BRAND.colors.text};">${invitation.role}</strong>, you'll be able to:
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        ${featuresHtml}
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding:8px 0;">
            ${button('Accept Invitation & Join Team', inviteUrl)}
          </td>
        </tr>
      </table>

      <p style="font-size:13px;color:${BRAND.colors.textMuted};margin:24px 0 0 0;line-height:1.6;">
        This invitation will expire in 7 days. If you have any questions, feel free to reach out to ${invitedBy.name}.
      </p>
    `;

    return baseLayout({
      preheader: `${invitedBy.name} invited you to join "${workspace.name}" — accept to start tracking habits together!`,
      heading: `You're invited to join ${workspace.name}`,
      headingEmoji: '🤝',
      body,
      footerNote: 'If you didn\'t expect this invitation, you can safely ignore this email.',
    });
  }
}

module.exports = new EmailService();
