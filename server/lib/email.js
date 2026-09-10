import { Resend } from 'resend';
import { logger } from './logger.js';

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.EMAIL_FROM || 'Zuna Support <onboarding@resend.dev>';

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
        You have been assigned a new support ticket.
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
          <tr><td style="padding: 6px 0; color: #94a3b8;">Product:</td><td style="padding: 6px 0; color: #f8fafc; font-weight: 600;">${productName}</td></tr>
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
      <p style="margin: 0;">Automated notification from Zuna Support Hub.</p>
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

export const emailService = {
  /**
   * Send ticket assignment email to admin
   */
  async sendTicketAssignmentEmail({ ticket, agentName, agentEmail }) {
    if (!resend) {
      logger.warn({ agentEmail }, 'Resend API key not configured. Skipping assignment email.');
      return { success: false, reason: 'RESEND_API_KEY missing' };
    }

    if (!agentEmail || !agentEmail.includes('@')) {
      return { success: false, reason: 'Invalid agent email' };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [agentEmail],
        subject: `[Assigned Ticket #${ticket.id}] ${ticket.subject}`,
        html: generateTicketAssignmentEmailHtml({ ticket, agentName })
      });

      if (error) {
        logger.error({ error, agentEmail }, 'Failed to send assignment email via Resend');
        return { success: false, error };
      }

      logger.info({ emailId: data.id, agentEmail }, 'Assignment email dispatched successfully');
      return { success: true, id: data.id };
    } catch (err) {
      logger.error(err, 'Resend dispatch exception');
      return { success: false, error: err.message };
    }
  },

  /**
   * Send admin reply email to client
   */
  async sendClientReplyEmail({ ticket, clientEmail, authorName, text }) {
    if (!resend) {
      logger.warn({ clientEmail }, 'Resend API key not configured. Skipping reply email.');
      return { success: false, reason: 'RESEND_API_KEY missing' };
    }

    if (!clientEmail || !clientEmail.includes('@')) {
      return { success: false, reason: 'Invalid client email' };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [clientEmail],
        subject: `[Update] Ticket #${ticket.id}: ${ticket.subject}`,
        html: generateClientReplyEmailHtml({ ticket, authorName, text })
      });

      if (error) {
        logger.error({ error, clientEmail }, 'Failed to send client reply email via Resend');
        return { success: false, error };
      }

      logger.info({ emailId: data.id, clientEmail }, 'Client reply email dispatched successfully');
      return { success: true, id: data.id };
    } catch (err) {
      logger.error(err, 'Resend reply dispatch exception');
      return { success: false, error: err.message };
    }
  }
};
