const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  async init() {
    // Check if real email credentials are provided
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Use real email service (Gmail, Outlook, etc.)
      console.log('📧 Initializing real email service...');
      
      const emailService = process.env.EMAIL_SERVICE || 'gmail';
      
      if (emailService === 'gmail') {
        // Gmail-specific configuration with proper SSL handling
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          host: 'smtp.gmail.com',
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          tls: {
            rejectUnauthorized: false // Accept self-signed certificates
          }
        });
      } else {
        // Other email services
        this.transporter = nodemailer.createTransport({
          service: emailService,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          tls: {
            rejectUnauthorized: false
          }
        });
      }
      
      console.log('📧 Real email service initialized with:', process.env.EMAIL_USER);
      
      // Test the connection
      try {
        await this.transporter.verify();
        console.log('✅ Email service connection verified successfully!');
      } catch (verifyError) {
        console.warn('⚠️ Email service verification failed, but will continue:', verifyError.message);
      }
    } else {
      // Fallback to Ethereal Email for testing
      console.log('📧 No real email credentials found, using test email service...');
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log('📧 Test email service initialized with:', testAccount.user);
      } catch (error) {
        console.error('❌ Failed to initialize email service:', error);
        // Fallback to console logging
        this.transporter = {
          sendMail: async (mailOptions) => {
            console.log('📧 EMAIL WOULD BE SENT:');
            console.log('To:', mailOptions.to);
            console.log('Subject:', mailOptions.subject);
            console.log('HTML:', mailOptions.html);
            return { messageId: 'console-' + Date.now() };
          }
        };
      }
    }
  }

  async sendInvitationEmail(invitation, workspace, invitedBy) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    const inviteUrl = `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${invitation.token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Bito Team" <noreply@bito.app>',
      to: invitation.email,
      subject: `You're invited to join "${workspace.name}" on Bito`,
      html: this.generateInvitationHTML(invitation, workspace, invitedBy, inviteUrl)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      // Log result based on email type
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log('📧 Real email sent successfully to:', mailOptions.to);
        console.log('📧 Message ID:', info.messageId);
      } else {
        // For test emails, log the preview URL
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📧 Test email sent! Preview URL:', previewUrl);
        }
      }
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) ? nodemailer.getTestMessageUrl(info) : null
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
