import type { Router as ExpressRouter } from 'express';
import { Router, Request, Response } from 'express';
import { getTranslations, Language } from '@/locales/emailTranslations';
import { renderEmailTemplate, htmlToPlainText } from '@/utils/templateEngine';

const router: ExpressRouter = Router();
const LOGO_URL = process.env['EMAIL_LOGO_URL'] || 'https://tiimio-assets.s3.eu-west-1.amazonaws.com/valkku_logo.svg';

// GET /api/dev - Admin Dashboard
router.get('/', (_req: Request, res: Response) => {
  const baseUrl = process.env['BACKEND_URL'] || 'http://localhost:8333';

  const templates = [
    {
      name: 'Welcome Email',
      type: 'welcome',
      description: 'Sent to new users after signup',
      params: 'userName=Aku&email=user@example.com'
    },
    {
      name: 'Team Invitation',
      type: 'teamInvitation',
      description: 'Sent when inviting someone to join a team',
      params: 'teamName=Warriors&inviterName=Coach&role=athlete&recipientName=Aku&email=user@example.com'
    },
    {
      name: 'Password Reset',
      type: 'passwordReset',
      description: 'Sent when user requests password reset',
      params: 'userName=Aku&email=user@example.com'
    },
    {
      name: 'Team Added',
      type: 'teamAdded',
      description: 'Sent when user is directly added to a team (without invitation)',
      params: 'teamName=Warriors&role=athlete&recipientName=Aku&email=user@example.com'
    }
  ];

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Valkku Admin Dashboard</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 40px 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        header {
          background: white;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
          font-size: 36px;
          color: #1a202c;
          margin-bottom: 8px;
        }
        .subtitle {
          color: #718096;
          font-size: 16px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }
        .card {
          background: white;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .card h3 {
          font-size: 22px;
          color: #1a202c;
          margin-bottom: 12px;
        }
        .card p {
          color: #718096;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        .links {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          padding: 10px 20px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .btn-primary:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        .btn-secondary {
          background: #edf2f7;
          color: #4a5568;
        }
        .btn-secondary:hover {
          background: #e2e8f0;
        }
        .lang-tag {
          display: inline-block;
          padding: 4px 12px;
          background: #f7fafc;
          color: #4a5568;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          margin-right: 8px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          color: white;
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>📧 Email Template Dashboard</h1>
          <p class="subtitle">Preview all email templates for Valkku</p>
        </header>

        <div class="grid">
          ${templates.map(template => `
            <div class="card">
              <h3>${template.name}</h3>
              <p>${template.description}</p>
              <div class="links">
                <a href="${baseUrl}/api/dev/email-preview?type=${template.type}&lang=en&${template.params}"
                   class="btn btn-primary" target="_blank">
                  <span class="lang-tag">EN</span> Preview
                </a>
                <a href="${baseUrl}/api/dev/email-preview?type=${template.type}&lang=fi&${template.params}"
                   class="btn btn-primary" target="_blank">
                  <span class="lang-tag">FI</span> Preview
                </a>
                <a href="${baseUrl}/api/dev/email-preview?type=${template.type}&lang=en&format=text&${template.params}"
                   class="btn btn-secondary" target="_blank">
                  Text Version
                </a>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          <p>💻 Valkku Backend ${process.env['NODE_ENV'] || 'development'} environment</p>
        </div>
      </div>
    </body>
    </html>
  `;

  res.type('text/html').send(html);
});

// GET /api/dev/email-preview?type=welcome&lang=en
router.get('/email-preview', (req: Request, res: Response) => {
  const type = (req.query['type'] as string) || 'welcome';
  const lang = ((req.query['lang'] as string) || 'en') as Language;
  const email = (req.query['email'] as string) || 'preview@example.com';

  try {
    let html = '';
    const footer = getTranslations('email.footer', lang, { recipientEmail: email });

    if (type === 'welcome') {
      const userName = (req.query['userName'] as string) || 'Aku';
      const appUrl = process.env['FRONTEND_URL'] || 'https://example.com';
      const t = getTranslations('email.welcome', lang, { userName, appUrl });
      html = renderEmailTemplate('welcome', {
        ...t,
        app_url: appUrl,
        logoUrl: LOGO_URL,
        recipient_email: email,
        footerCopyright: footer['copyright'],
        footerSentTo: footer['sentTo']
      });
    } else if (type === 'teamInvitation') {
      const teamName = (req.query['teamName'] as string) || 'Warriors';
      const inviterName = (req.query['inviterName'] as string) || 'Coach';
      const role = (req.query['role'] as string) || 'athlete';
      const recipientName = (req.query['recipientName'] as string) || 'Aku';
      const inviteUrl = (req.query['inviteUrl'] as string) || `${process.env['FRONTEND_URL'] || 'https://example.com'}/invite/demo-token`;
      const t = getTranslations('email.teamInvitation', lang, { teamName, inviterName, role, recipientName, inviteUrl });
      html = renderEmailTemplate('team-invitation', {
        ...t,
        invite_url: inviteUrl,
        logoUrl: LOGO_URL,
        recipient_email: email,
        footerCopyright: footer['copyright'],
        footerSentTo: footer['sentTo']
      });
    } else if (type === 'passwordReset') {
      const userName = (req.query['userName'] as string) || 'Aku';
      const resetUrl = (req.query['resetUrl'] as string) || `${process.env['FRONTEND_URL'] || 'https://example.com'}/reset-password/demo-token`;
      const t = getTranslations('email.passwordReset', lang, { userName, resetUrl });
      html = renderEmailTemplate('password-reset', {
        ...t,
        reset_url: resetUrl,
        logoUrl: LOGO_URL,
        recipient_email: email,
        footerCopyright: footer['copyright'],
        footerSentTo: footer['sentTo']
      });
    } else if (type === 'teamAdded') {
      const teamName = (req.query['teamName'] as string) || 'Warriors';
      const role = (req.query['role'] as string) || 'athlete';
      const recipientName = (req.query['recipientName'] as string) || 'Aku';
      const teamUrl = process.env['FRONTEND_URL'] || 'https://example.com';
      const t = getTranslations('email.teamAdded', lang, { teamName, role, recipientName });
      html = renderEmailTemplate('team-added', {
        ...t,
        team_url: teamUrl,
        logoUrl: LOGO_URL,
        recipient_email: email,
        footerCopyright: footer['copyright'],
        footerSentTo: footer['sentTo']
      });
    } else {
      res.status(400).json({ error: 'Invalid type. Use welcome | teamInvitation | passwordReset | teamAdded' });
      return;
    }

    // Allow cross-origin image fetches for the preview HTML only
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    if ((req.query['format'] as string) === 'text') {
      res.type('text/plain').send(htmlToPlainText(html));
      return;
    }

    res.type('text/html').send(html);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to render preview' });
  }
});

export default router;
