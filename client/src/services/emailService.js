/**
 * Zuna Support - Resend Email Notification Service
 * Sends automated transactional notification emails when tickets are assigned to team members.
 */

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';

/**
 * Generate a rich, responsive HTML email template for ticket assignments
 */
const generateTicketAssignmentEmailHtml = ({ ticket, agentName, agentEmail }) => {
  const ticketId = ticket.id || 'N/A';
  const subject = ticket.subject || 'Support Ticket';
  const description = ticket.description || 'No description provided.';
  const clientName = ticket.clientName || ticket.raisedBy?.name || ticket.customer_name || 'Client';
  const clientEmail = ticket.clientEmail || ticket.raisedBy?.email || ticket.customer_email || 'Not specified';
  const productName = ticket.productName || ticket.product_name || 'General Support';
  const priority = (ticket.priority || 'medium').toString().toUpperCase();
  const status = (ticket.status || 'open').toString().toUpperCase();
  const createdDate = ticket.createdAt 
    ? (typeof ticket.createdAt === 'string' ? new Date(ticket.createdAt).toLocaleString() : 'Recently')
    : new Date().toLocaleString();

  let priorityColor = '#0084FF';
  if (priority === 'URGENT') priorityColor = '#EF4444';
  else if (priority === 'HIGH') priorityColor = '#F59E0B';
  else if (priority === 'LOW') priorityColor = '#64748B';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket #${ticketId} Assigned</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <div style="max-width: 600px; margin: 30px auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0084FF, #00F5D4); padding: 28px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">ZUNA SUPPORT SYSTEM</h1>
      <p style="margin: 6px 0 0; font-size: 14px; font-weight: 600; color: #0f172a; opacity: 0.9;">New Support Ticket Assignment</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 28px 24px;">
      <p style="margin: 0 0 16px; font-size: 16px; color: #e2e8f0;">
        Hello <strong>${agentName || 'Team Member'}</strong>,
      </p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #94a3b8; line-height: 1.5;">
        You have been assigned a new support ticket. Below are the complete ticket details for your review and action.
      </p>

      <!-- Ticket Summary Card -->
      <div style="background: #0f172a; border-radius: 12px; border: 1px solid #334155; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 14px; margin-bottom: 14px;">
          <div>
            <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Ticket ID</span>
            <div style="font-size: 18px; font-weight: 800; color: #00F5D4; margin-top: 2px;">#${ticketId}</div>
          </div>
          <div style="text-align: right;">
            <span style="background: ${priorityColor}; color: #ffffff; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 800; text-transform: uppercase;">
              ${priority}
            </span>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; width: 120px;">Product:</td>
            <td style="padding: 6px 0; color: #f8fafc; font-weight: 600;">${productName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Client Name:</td>
            <td style="padding: 6px 0; color: #f8fafc; font-weight: 600;">${clientName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Client Email:</td>
            <td style="padding: 6px 0; color: #38bdf8;">${clientEmail}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Status:</td>
            <td style="padding: 6px 0; color: #10b981; font-weight: 700;">${status}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Created:</td>
            <td style="padding: 6px 0; color: #cbd5e1;">${createdDate}</td>
          </tr>
        </table>
      </div>

      <!-- Subject & Description -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8;">Subject</h3>
        <div style="font-size: 16px; font-weight: 700; color: #f8fafc; margin-bottom: 16px;">
          ${subject}
        </div>

        <h3 style="margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8;">Issue Description</h3>
        <div style="background: #0f172a; border-radius: 8px; border: 1px solid #334155; padding: 14px 16px; font-size: 13px; color: #cbd5e1; line-height: 1.6; white-space: pre-wrap;">
${description}
        </div>
      </div>

      <!-- Call to Action -->
      <div style="text-align: center; margin: 30px 0 10px;">
        <a href="http://localhost:5173/admin/dashboard/tickets" style="display: inline-block; background: linear-gradient(135deg, #0084FF, #00F5D4); color: #0f172a; text-decoration: none; padding: 12px 28px; font-weight: 800; font-size: 14px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0, 132, 255, 0.4);">
          Open Ticket in Dashboard
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #0f172a; padding: 16px 24px; text-align: center; border-top: 1px solid #334155; font-size: 12px; color: #64748b;">
      <p style="margin: 0;">This is an automated notification from Zuna HRMS & Central Ticket Monitor.</p>
      <p style="margin: 4px 0 0;">Recipient: ${agentEmail}</p>
    </div>

  </div>
</body>
</html>
  `;
};

export const emailService = {
  /**
   * Send ticket assignment email via Resend API
   * @param {Object} params
   * @param {Object} params.ticket - The ticket data object
   * @param {string} params.agentName - The assigned member's name
   * @param {string} params.agentEmail - The assigned member's email address
   * @returns {Promise<{success: boolean, id?: string, error?: string}>}
   */
  sendTicketAssignmentEmail: async ({ ticket, agentName, agentEmail }) => {
    if (!agentEmail || !agentEmail.trim() || !agentEmail.includes('@')) {
      console.warn('Cannot send assignment email: Invalid or missing agent email:', agentEmail);
      return { success: false, error: 'No valid email address found for the selected team member.' };
    }

    const apiKey = RESEND_API_KEY;
    if (!apiKey) {
      console.error('Resend API key missing in environment variables.');
      return { success: false, error: 'Resend API key is not configured.' };
    }

    const ticketId = ticket.id || 'N/A';
    const subject = `[Assigned Ticket #${ticketId}] ${ticket.subject || 'Support Ticket'} - ${ticket.productName || 'Zuna'}`;
    const html = generateTicketAssignmentEmailHtml({ ticket, agentName, agentEmail });

    const fromSender = import.meta.env.VITE_RESEND_FROM_EMAIL || 'Zuna Support <onboarding@resend.dev>';
    const payload = {
      from: fromSender,
      to: [agentEmail.trim()],
      subject: subject,
      html: html
    };

    // Try through Vite local proxy first to avoid any browser CORS issues
    const endpoints = [
      '/api/resend/emails',
      'https://api.resend.com/emails'
    ];

    let lastError = null;

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.id) {
          console.log(`✓ Resend email successfully sent to ${agentEmail} (ID: ${data.id})`);
          return { success: true, id: data.id, recipient: agentEmail };
        } else {
          const errMsg = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
          console.warn(`Resend request to ${url} failed:`, errMsg);
          lastError = errMsg;
          // If it was a 400 or 403 or specific validation error from Resend, don't retry same payload with second url
          if (response.status === 400 || response.status === 403 || response.status === 422) {
            return { success: false, error: errMsg, recipient: agentEmail };
          }
        }
      } catch (err) {
        console.warn(`Failed fetch to ${url}:`, err);
        lastError = err.message || 'Network error';
      }
    }

    return { 
      success: false, 
      error: lastError || 'Failed to dispatch email via Resend API.',
      recipient: agentEmail
    };
  }
};
