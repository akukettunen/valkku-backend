import { Router, Request, Response } from 'express';
import { getTranslations, Language } from '@/locales/emailTranslations';
import { renderEmailTemplate, htmlToPlainText } from '@/utils/templateEngine';

const router = Router();
const LOGO_URL = process.env['EMAIL_LOGO_URL'] || 'https://tiimio-assets.s3.eu-west-1.amazonaws.com/valkku_logo.svg';

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
