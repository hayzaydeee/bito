const { Resend } = require('resend');

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

  async sendInvitationEmail(invitation, workspace, invitedBy) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    // Get base URL and normalize to remove www
    let baseUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    baseUrl = baseUrl.replace('://www.', '://'); // Remove www if present
    
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Bito Team" <noreply@bito.app>',
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
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're invited to join ${workspace.name}</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
                background-color: #f8fafc;
            }
            .container { 
                background: white; 
                border-radius: 12px; 
                padding: 40px; 
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
            }
            .logo { 
                font-size: 28px; 
                font-weight: bold; 
                color: #3b82f6; 
                margin-bottom: 10px; 
            }
            .workspace-name { 
                color: #3b82f6; 
                font-weight: 600; 
            }
            .invite-button { 
                display: inline-block; 
                background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600; 
                margin: 20px 0; 
                text-align: center;
            }
            .invite-button:hover { 
                background: linear-gradient(135deg, #1d4ed8, #1e40af); 
            }
            .message { 
                background: #f1f5f9; 
                padding: 20px; 
                border-radius: 8px; 
                margin: 20px 0; 
                border-left: 4px solid #3b82f6; 
            }
            .footer { 
                text-align: center; 
                margin-top: 30px; 
                padding-top: 20px; 
                border-top: 1px solid #e2e8f0; 
                color: #64748b; 
                font-size: 14px; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎯 Bito</div>
                <h1>You're invited to join <span class="workspace-name">${workspace.name}</span></h1>
            </div>
            
            <p>Hi there!</p>
            
            <p><strong>${invitedBy.name}</strong> has invited you to join the <strong>${workspace.name}</strong> workspace on Bito, where teams track habits together and support each other's growth.</p>
            
            ${invitation.message ? `
            <div class="message">
                <strong>Personal message from ${invitedBy.name}:</strong><br>
                "${invitation.message}"
            </div>
            ` : ''}
            
            <p>As a <strong>${invitation.role}</strong>, you'll be able to:</p>
            <ul>
                <li>📊 Track your personal habits within the team workspace</li>
                <li>👥 See team progress and celebrate achievements together</li>
                <li>🎯 Adopt workspace habit templates or create your own</li>
                <li>🏆 Participate in team challenges and leaderboards</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" class="invite-button">Accept Invitation & Join Team</a>
            </div>
            
            <p>This invitation will expire in 7 days. If you have any questions, feel free to reach out to ${invitedBy.name} or our support team.</p>
            
            <div class="footer">
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                <p>This email was sent by <a href="https://bito.app" style="color: #3b82f6;">Bito</a> - Habit tracking for teams</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

module.exports = new EmailService();
