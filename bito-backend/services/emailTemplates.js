/**
 * Shared Email Template System
 *
 * Provides a consistent, professional branded layout for all Bito emails.
 * Uses table-based HTML for maximum email-client compatibility (Outlook, Gmail, Apple Mail, etc.).
 *
 * Key principles:
 *  - Table layout everywhere (no flexbox/grid — they break in Outlook)
 *  - Inline styles on every element (many clients strip <style> blocks)
 *  - Preheader text for inbox preview
 *  - Consistent brand identity across all emails
 *  - Dark-mode friendly color choices
 */

// ── Brand constants ──────────────────────────────────────
const BRAND = {
  name: 'Bito',
  emoji: '🎯',
  tagline: 'Build better habits, together.',
  url: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
  colors: {
    primary: '#6366f1',     // Indigo-500
    primaryDark: '#4f46e5', // Indigo-600
    primaryLight: '#e0e7ff',// Indigo-100
    accent: '#8b5cf6',      // Violet-500
    bg: '#f8fafc',          // Slate-50
    cardBg: '#ffffff',
    text: '#1e293b',        // Slate-800
    textSecondary: '#475569',// Slate-600
    textMuted: '#94a3b8',   // Slate-400
    border: '#e2e8f0',      // Slate-200
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
  fonts: "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
};

// Normalize the URL (remove www)
BRAND.url = BRAND.url.replace('://www.', '://');

// ── Helper: build an inline style string from an object ──
function style(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`)
    .join(';');
}

// ── Components ───────────────────────────────────────────

/**
 * Primary CTA button (table-based for Outlook compatibility)
 */
function button(text, href, extraStyle = {}) {
  const s = {
    backgroundColor: BRAND.colors.primary,
    color: '#ffffff',
    fontFamily: BRAND.fonts,
    fontSize: '15px',
    fontWeight: '600',
    textDecoration: 'none',
    padding: '14px 36px',
    borderRadius: '10px',
    display: 'inline-block',
    letterSpacing: '0.2px',
    ...extraStyle,
  };
  // VML fallback for Outlook thick buttons
  return `
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
      href="${href}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="21%" fillcolor="${BRAND.colors.primary}" stroke="f">
      <w:anchorlock/>
      <center style="color:#ffffff;font-family:${BRAND.fonts};font-size:15px;font-weight:600;">${text}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <a href="${href}" style="${style(s)}" target="_blank">${text}</a>
    <!--<![endif]-->
  `;
}

/**
 * Secondary / ghost button
 */
function buttonSecondary(text, href) {
  return button(text, href, {
    backgroundColor: 'transparent',
    color: BRAND.colors.primary,
    border: `2px solid ${BRAND.colors.primary}`,
    padding: '12px 32px',
  });
}

/**
 * Stat pill — big number + label
 */
function statPill(value, label) {
  return `
    <td style="padding:0 12px;text-align:center;">
      <div style="font-size:30px;font-weight:800;color:${BRAND.colors.text};font-family:${BRAND.fonts};line-height:1.2;">${value}</div>
      <div style="font-size:11px;color:${BRAND.colors.textMuted};text-transform:uppercase;letter-spacing:0.8px;font-family:${BRAND.fonts};margin-top:4px;">${label}</div>
    </td>
  `;
}

/**
 * Horizontal divider
 */
function divider(marginTop = '28px', marginBottom = '28px') {
  return `<tr><td style="padding:0;"><div style="margin:${marginTop} 0 ${marginBottom};height:1px;background:${BRAND.colors.border};"></div></td></tr>`;
}

/**
 * Info/tip card (colored left border)
 */
function infoCard(content, { borderColor = BRAND.colors.primary, bgColor = BRAND.colors.primaryLight } = {}) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td style="background:${bgColor};border-left:4px solid ${borderColor};border-radius:8px;padding:18px 20px;font-family:${BRAND.fonts};font-size:14px;color:${BRAND.colors.textSecondary};line-height:1.7;">
          ${content}
        </td>
      </tr>
    </table>
  `;
}

/**
 * Section title
 */
function sectionTitle(text) {
  return `<h2 style="font-family:${BRAND.fonts};font-size:16px;font-weight:700;color:${BRAND.colors.text};margin:28px 0 14px 0;padding:0;">${text}</h2>`;
}

// ── Base Layout ──────────────────────────────────────────

/**
 * Wrap email body content in the branded base layout.
 *
 * @param {Object} opts
 * @param {string} opts.preheader    — Hidden preview text shown in inbox list
 * @param {string} opts.heading      — Main heading (e.g. "Welcome to Bito")
 * @param {string} opts.headingEmoji — Emoji before brand name in header bar
 * @param {string} opts.body         — Inner HTML content (the email-specific part)
 * @param {string} [opts.footerNote] — Extra line above the footer links
 * @returns {string} Complete HTML email document
 */
function baseLayout({ preheader = '', heading = '', headingEmoji = BRAND.emoji, body, footerNote = '' }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${heading || BRAND.name}</title>
  <!--[if mso]>
  <noscript><xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml></noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, a { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }

    /* Dark mode overrides */
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #0f172a !important; }
      .email-card { background-color: #1e293b !important; }
      .text-primary { color: #f1f5f9 !important; }
      .text-secondary { color: #cbd5e1 !important; }
      .text-muted { color: #64748b !important; }
      .stat-value { color: #f1f5f9 !important; }
      .divider { background-color: #334155 !important; }
      .info-card { background-color: #312e81 !important; border-left-color: #818cf8 !important; }
    }

    /* Mobile */
    @media only screen and (max-width: 600px) {
      .email-card { padding: 28px 20px !important; }
      .stat-cell { padding: 0 8px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:${BRAND.colors.bg};">

  <!-- Preheader (hidden inbox preview text) -->
  <div style="display:none;font-size:1px;color:${BRAND.colors.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${preheader}${'&nbsp;&zwnj;'.repeat(40)}
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-bg" style="background-color:${BRAND.colors.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Inner card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- Header bar -->
          <tr>
            <td align="center" style="padding:0 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:${BRAND.fonts};font-size:18px;font-weight:700;color:${BRAND.colors.text};">
                    <span style="font-size:22px;vertical-align:middle;margin-right:6px;">${headingEmoji}</span>
                    <span class="text-primary" style="vertical-align:middle;letter-spacing:-0.3px;">${BRAND.name}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td class="email-card" style="background:${BRAND.colors.cardBg};border-radius:16px;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                ${heading ? `
                <tr>
                  <td align="center" style="padding:0 0 24px 0;">
                    <h1 class="text-primary" style="font-family:${BRAND.fonts};font-size:24px;font-weight:800;color:${BRAND.colors.text};margin:0;line-height:1.3;letter-spacing:-0.3px;">
                      ${heading}
                    </h1>
                  </td>
                </tr>
                ` : ''}

                <!-- Email body -->
                <tr>
                  <td style="font-family:${BRAND.fonts};font-size:15px;color:${BRAND.colors.textSecondary};line-height:1.7;">
                    ${body}
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0 0;text-align:center;">
              ${footerNote ? `<p class="text-muted" style="font-family:${BRAND.fonts};font-size:13px;color:${BRAND.colors.textMuted};margin:0 0 12px 0;">${footerNote}</p>` : ''}
              <p class="text-muted" style="font-family:${BRAND.fonts};font-size:12px;color:${BRAND.colors.textMuted};margin:0;line-height:1.6;">
                <a href="${BRAND.url}/app/settings" style="color:${BRAND.colors.primary};text-decoration:underline;">Email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="${BRAND.url}" style="color:${BRAND.colors.primary};text-decoration:underline;">Open Bito</a>
              </p>
              <p class="text-muted" style="font-family:${BRAND.fonts};font-size:11px;color:${BRAND.colors.textMuted};margin:12px 0 0 0;">
                ${BRAND.name} &mdash; ${BRAND.tagline}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Exports ──────────────────────────────────────────────
module.exports = {
  BRAND,
  baseLayout,
  button,
  buttonSecondary,
  statPill,
  divider,
  infoCard,
  sectionTitle,
  style,
};
