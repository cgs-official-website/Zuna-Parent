import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { logger } from './logger.js';

/**
 * Configure Nodemailer SMTP Transporter dynamically from environment
 */
function createNodemailerTransporter() {
  const smtpService = process.env.SMTP_SERVICE; // e.g. 'gmail'
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpService && smtpUser && smtpPass) {
    logger.info({ service: smtpService, user: smtpUser }, 'Initialized Nodemailer using service provider');
    return nodemailer.createTransport({
      service: smtpService,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  }

  if (smtpHost && smtpUser && smtpPass) {
    logger.info({ host: smtpHost, port: smtpPort, user: smtpUser }, 'Initialized Nodemailer using custom SMTP host');
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: process.env.SMTP_SECURE === 'true' || smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: process.env.SMTP_IGNORE_TLS === 'true' ? false : true
      }
    });
  }

  return null;
}

const transporter = createNodemailerTransporter();

// Fallback to Resend if configured
const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const fromEmail =
  process.env.EMAIL_FROM ||
  process.env.SMTP_FROM ||
  (process.env.SMTP_USER ? `Zuna Support <${process.env.SMTP_USER}>` : 'Zuna Support <notifications@zuna.carrezzaglobalsolutions.com>');

/**
 * Core email dispatcher with Nodemailer priority and Resend fallback
 */
async function dispatchEmail({ to, subject, html }) {
  const recipient = Array.isArray(to) ? to[0] : to;

  if (!recipient || !recipient.includes('@')) {
    return { success: false, reason: 'Invalid recipient email' };
  }

  // 1. Try Nodemailer SMTP first
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromEmail,
        to: recipient,
        subject,
        html
      });
      logger.info({ messageId: info.messageId, recipient }, 'Email sent successfully via Nodemailer');
      return { success: true, id: info.messageId, provider: 'nodemailer' };
    } catch (err) {
      logger.error({ error: err.message, recipient }, 'Nodemailer sendMail failed');
      // If Resend is also configured, attempt fallback below
      if (!resend) {
        return { success: false, error: err.message, provider: 'nodemailer' };
      }
    }
  }

  // 2. Fallback to Resend if Nodemailer not configured or failed
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [recipient],
        subject,
        html
      });
      if (error) {
        logger.error({ error, recipient }, 'Failed to send email via Resend');
        return { success: false, error, provider: 'resend' };
      }
      logger.info({ emailId: data.id, recipient }, 'Email sent successfully via Resend fallback');
      return { success: true, id: data.id, provider: 'resend' };
    } catch (err) {
      logger.error(err, 'Resend dispatch exception');
      return { success: false, error: err.message };
    }
  }

  logger.warn(
    { recipient },
    'Neither Nodemailer nor Resend is configured. Set SMTP_USER & SMTP_PASS in .env to enable email sending.'
  );
  return { success: false, reason: 'No email transport configured' };
}

/**
 * Generate assignment notification email HTML
 */
function generateTicketAssignmentEmailHtml({ ticket, agentName }) {
  const ticketId = ticket.id || 'N/A';
  const subject = ticket.subject || 'Support Ticket';
  const description = ticket.description || 'No description provided.';
  const clientName = ticket.clientName || 'Client';
  const clientEmail = ticket.clientEmail || 'Not specified';
  const productName = ticket.product?.title || ticket.productNameSnapshot || 'General Support';
  const priority = (ticket.priority || 'MEDIUM').toUpperCase();
  const status = (ticket.status || 'OPEN').toUpperCase();

  let priorityColor = '#0084FF';
  if (priority === 'URGENT') priorityColor = '#EF4444';
  else if (priority === 'HIGH') priorityColor = '#F59E0B';
  else if (priority === 'LOW') priorityColor = '#64748B';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ticket #${ticketId} Assigned</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
  <div style="max-width: 600px; margin: 30px auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #0084FF, #00F5D4); padding: 28px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a;">ZUNA SUPPORT SYSTEM</h1>
      <p style="margin: 6px 0 0; font-size: 14px; font-weight: 600; color: #0f172a;">New Support Ticket Assignment</p>
    </div>
    <div style="padding: 28px 24px;">
      <p style="margin: 0 0 16px; font-size: 16px; color: #e2e8f0;">
        Hello <strong>${agentName || 'Team Member'}</strong>,
      </p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #94a3b8; line-height: 1.5;">
        You have been assigned a new support ticket in the Zuna Central Admin portal.
      </p>
      <div style="background: #0f172a; border-radius: 12px; border: 1px solid #334155; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 14px; margin-bottom: 14px;">
          <div>
            <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase;">Ticket ID</span>
            <div style="font-size: 18px; font-weight: 800; color: #00F5D4;">#${ticketId}</div>
          </div>
          <div>
            <span style="background: ${priorityColor}; color: #ffffff; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 800;">
              ${priority}
            </span>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr><td style="padding: 6px 0; color: #94a3b8; width: 100px;">Product:</td><td style="padding: 6px 0; color: #f8fafc; font-weight: 600;">${productName}</td></tr>
          <tr><td style="padding: 6px 0; color: #94a3b8;">Client:</td><td style="padding: 6px 0; color: #f8fafc; font-weight: 600;">${clientName} (${clientEmail})</td></tr>
          <tr><td style="padding: 6px 0; color: #94a3b8;">Status:</td><td style="padding: 6px 0; color: #10b981; font-weight: 700;">${status}</td></tr>
        </table>
      </div>
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 8px; font-size: 14px; text-transform: uppercase; color: #94a3b8;">Subject</h3>
        <div style="font-size: 16px; font-weight: 700; color: #f8fafc; margin-bottom: 16px;">${subject}</div>
        <h3 style="margin: 0 0 8px; font-size: 14px; text-transform: uppercase; color: #94a3b8;">Description</h3>
        <div style="background: #0f172a; border-radius: 8px; border: 1px solid #334155; padding: 14px 16px; font-size: 13px; color: #cbd5e1; line-height: 1.6; white-space: pre-wrap;">${description}</div>
      </div>
    </div>
    <div style="background: #0f172a; padding: 16px 24px; text-align: center; border-top: 1px solid #334155; font-size: 12px; color: #64748b;">
      <p style="margin: 0;">Automated notification via Nodemailer from Zuna Support Hub.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate client notification email when admin replies
 */
function generateClientReplyEmailHtml({ ticket, authorName, text }) {
  const ticketId = ticket.id;
  const subject = ticket.subject;
  const productName = ticket.product?.title || ticket.productNameSnapshot || 'Support';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Update on Ticket #${ticketId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
  <div style="max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    <div style="background: #0284c7; padding: 24px; text-align: center; color: #ffffff;">
      <h2 style="margin: 0; font-size: 20px;">Support Response: Ticket #${ticketId}</h2>
      <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">${productName} Help Desk</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 15px; margin-bottom: 20px;">
        Hello <strong>${ticket.clientName}</strong>,
      </p>
      <p style="font-size: 14px; color: #475569; margin-bottom: 16px;">
        Our support engineer <strong>${authorName}</strong> has posted an update regarding your issue:
      </p>
      <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 16px; margin: 16px 0; font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-wrap;">${text}</div>
      <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
        Regarding: <em>"${subject}"</em>
      </p>
    </div>
    <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
      <p style="margin: 0;">Zuna Customer Support & Assistance</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate welcome email HTML for new team member
 */
function generateTeamWelcomeEmailHtml({ member, rawPassword }) {
  const loginUrl = `${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/admin`;
  const roleDisplay = (member.role || 'SUPPORT_ENGINEER').replace(/_/g, ' ');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Zuna Support Team</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0F1D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <div style="max-width: 580px; margin: 32px auto; background: #161F38; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);">
    <!-- Header with Zuna Branding -->
    <div style="background: linear-gradient(135deg, #FFC300 0%, #FFD60A 100%); padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #0A0A0A; letter-spacing: -0.02em;">Zuna</h1>
      <p style="margin: 6px 0 0; font-size: 13px; font-weight: 700; color: #0A0A0A; text-transform: uppercase; letter-spacing: 0.05em;">Enterprise Support Command Center</p>
    </div>

    <!-- Body -->
    <div style="padding: 32px 28px;">
      <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #ffffff;">Welcome aboard, ${member.name}!</h2>
      <p style="margin: 0 0 20px; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
        You have been provisioned as a <strong style="color: #FFD60A;">${roleDisplay}</strong> in the Zuna Central Admin Portal.
      </p>

      <!-- Credentials Card -->
      <div style="background: #0A0F1D; border-radius: 12px; border: 1px solid rgba(255, 195, 0, 0.3); padding: 22px; margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #FFC300; letter-spacing: 0.08em; margin-bottom: 16px;">
          Your Portal Credentials
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; width: 120px; font-weight: 500;">Login Portal:</td>
            <td style="padding: 8px 0; color: #f8fafc; font-weight: 600;">
              <a href="${loginUrl}" style="color: #FFD60A; text-decoration: underline;">${loginUrl}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-weight: 500;">Email:</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: 700; font-family: monospace; font-size: 15px;">${member.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-weight: 500;">Password:</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: 700; font-family: monospace; font-size: 15px; letter-spacing: 0.05em;">${rawPassword}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-weight: 500;">Assigned Role:</td>
            <td style="padding: 8px 0; color: #10B981; font-weight: 700;">${roleDisplay}</td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 28px 0;">
        <a href="${loginUrl}" style="display: inline-block; background: #FFC300; color: #0A0A0A; padding: 12px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 4px 14px rgba(255, 195, 0, 0.4);">
          Sign In to Dashboard &rarr;
        </a>
      </div>

      <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5; text-align: center;">
        <strong>Security Notice:</strong> Please log in and change your temporary password under Settings after your initial session.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #0A0F1D; padding: 18px 24px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 12px; color: #64748b;">
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} Carrezza Global Solutions &bull; Zuna Central Admin</p>
    </div>
  </div>
</body>
</html>
  `;
}

export const emailService = {
  /**
   * Send ticket assignment email to admin member using Nodemailer
   */
  async sendTicketAssignmentEmail({ ticket, agentName, agentEmail }) {
    const subject = `[Assigned Ticket #${ticket.id}] ${ticket.subject}`;
    const html = generateTicketAssignmentEmailHtml({ ticket, agentName });
    return dispatchEmail({ to: agentEmail, subject, html });
  },

  /**
   * Send admin reply email to client
   */
  async sendClientReplyEmail({ ticket, clientEmail, authorName, text }) {
    const subject = `[Update] Ticket #${ticket.id}: ${ticket.subject}`;
    const html = generateClientReplyEmailHtml({ ticket, authorName, text });
    return dispatchEmail({ to: clientEmail, subject, html });
  },

  /**
   * Send credentials email to newly invited team member
   */
  async sendTeamWelcomeEmail({ member, rawPassword }) {
    const subject = 'Welcome to Zuna Support Team — Your Access Credentials';
    const html = generateTeamWelcomeEmailHtml({ member, rawPassword });
    return dispatchEmail({ to: member.email, subject, html });
  }
};
