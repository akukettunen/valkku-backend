import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import { renderEmailTemplate, htmlToPlainText } from '@/utils/templateEngine';
import { getTranslations, type Language } from '@/locales/emailTranslations';
import { localizeRole } from '@/locales/roles';

// Initialize SES client
const sesClient = new SESClient({
  region: process.env['AWS_SES_REGION'] || 'eu-central-1',
  credentials: {
    accessKeyId: process.env['SES_ACCESS_KEY_ID'] || '',
    secretAccessKey: process.env['SES_SECRET_ACCESS_KEY'] || '',
  },
});

const LOGO_URL = process.env['EMAIL_LOGO_URL'] || 'https://tiimio-assets.s3.eu-west-1.amazonaws.com/valkku_logo.svg';
const DEFAULT_FROM_EMAIL = process.env['SES_FROM_EMAIL'] || 'no-reply@valkku.ai';
const DEFAULT_FROM_NAME = process.env['EMAIL_FROM_NAME'] || 'Valkku.ai';
const SUPPORT_EMAIL = process.env['SUPPORT_EMAIL'] || 'support@valkku.ai';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlBody?: string;
  textBody?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Low-level email sender using Amazon SES
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const {
    to,
    subject,
    htmlBody,
    textBody,
    from = DEFAULT_FROM_EMAIL,
    fromName = DEFAULT_FROM_NAME,
    replyTo,
    cc,
    bcc,
  } = options;

  if (!htmlBody && !textBody) {
    throw new Error('Either htmlBody or textBody must be provided');
  }

  const toAddresses = Array.isArray(to) ? to : [to];
  const source = fromName ? `${fromName} <${from}>` : from;

  const params: SendEmailCommandInput = {
    Source: source,
    Destination: {
      ToAddresses: toAddresses,
      ...(cc && { CcAddresses: Array.isArray(cc) ? cc : [cc] }),
      ...(bcc && { BccAddresses: Array.isArray(bcc) ? bcc : [bcc] }),
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        ...(htmlBody && {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
        }),
        ...(textBody && {
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        }),
      },
    },
    ...(replyTo && { ReplyToAddresses: [replyTo] }),
  };

  try {
    const command = new SendEmailCommand(params);
    await sesClient.send(command);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

const FOOTER = (email: string, lang: Language) => getTranslations('email.footer', lang, { recipientEmail: email });

export const sendWelcomeEmail = async (email: string, userName: string, lang: Language = 'en') => {
  const appUrl = process.env['FRONTEND_URL'] || 'https://example.com';
  const t = getTranslations('email.welcome', lang, { userName, appUrl });
  const f = FOOTER(email, lang);
  const subject = t['subject'];
  const html = renderEmailTemplate('welcome', {
    ...t,
    app_url: appUrl,
    logoUrl: LOGO_URL,
    supportEmail: SUPPORT_EMAIL,
    footerCopyright: f['copyright'],
    footerSentTo: f['sentTo'],
    recipient_email: email,
  });
  const text = htmlToPlainText(html);
  await sendEmail({ to: email, subject, htmlBody: html, textBody: text });
};

export const sendTeamInvitationEmail = async (
  email: string,
  teamName: string,
  inviterName: string,
  inviteToken: string,
  role: string,
  recipientName: string,
  lang: Language = 'en'
) => {
  const frontend = process.env['FRONTEND_URL'] || 'https://example.com';
  const inviteUrl = `${frontend}/#/join?token=${inviteToken}`;
  const roleLabel = localizeRole(role as any, lang);
  const t = getTranslations('email.teamInvitation', lang, { teamName, inviterName, role: roleLabel, recipientName, inviteUrl });
  const f = FOOTER(email, lang);
  const subject = t['subject'];
  const html = renderEmailTemplate('team-invitation', {
    ...t,
    invite_url: inviteUrl,
    logoUrl: LOGO_URL,
    supportEmail: SUPPORT_EMAIL,
    recipient_email: email,
    footerCopyright: f['copyright'],
    footerSentTo: f['sentTo'],
  });
  const text = htmlToPlainText(html);
  await sendEmail({ to: email, subject, htmlBody: html, textBody: text });
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName?: string,
  lang: Language = 'en'
) => {
  const resetUrl = `${process.env['FRONTEND_URL']}/#/reset-password/${resetToken}`;
  const t = getTranslations('email.passwordReset', lang, { userName, resetUrl });
  const f = FOOTER(email, lang);
  const subject = t['subject'];
  const html = renderEmailTemplate('password-reset', {
    ...t,
    reset_url: resetUrl,
    logoUrl: LOGO_URL,
    footerCopyright: f['copyright'],
    footerSentTo: f['sentTo'],
    recipient_email: email,
  });
  const text = htmlToPlainText(html);
  await sendEmail({ to: email, subject, htmlBody: html, textBody: text });
};

export const sendTeamAddedEmail = async (
  email: string,
  teamName: string,
  role: string,
  recipientName?: string,
  lang: Language = 'en'
) => {
  const teamUrl = process.env['FRONTEND_URL'] || 'https://example.com';
  const roleLabel = localizeRole(role as any, lang);
  const t = getTranslations('email.teamAdded', lang, { teamName, role: roleLabel, recipientName });
  const f = getTranslations('email.footer', lang, { recipientEmail: email });
  const subject = t['subject'];
  const html = renderEmailTemplate('team-added', {
    ...t,
    team_url: teamUrl,
    logoUrl: LOGO_URL,
    supportEmail: SUPPORT_EMAIL,
    recipient_email: email,
    footerCopyright: f['copyright'],
    footerSentTo: f['sentTo'],
  });
  const text = htmlToPlainText(html);
  await sendEmail({ to: email, subject, htmlBody: html, textBody: text });
};
