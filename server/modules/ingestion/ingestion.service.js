import { prisma } from '../../lib/prisma.js';
import { emitTicketCreated, emitNotification } from '../../lib/socket.js';
import { checkSlidingWindowRateLimit } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';

export class IngestionService {
  /**
   * Ingest ticket from external SaaS products via signed API Key
   */
  static async createExternalTicket(product, data) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Ticket record
      const ticket = await tx.ticket.create({
        data: {
          productId: product.id,
          productNameSnapshot: product.title,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          subject: data.subject,
          description: data.description,
          priority: data.priority,
          status: 'OPEN',
          source: 'EXTERNAL_API'
        },
        include: {
          product: {
            select: { id: true, title: true, category: true, badgeColor: true }
          },
          assignedAdmin: true,
          _count: {
            select: { messages: true }
          }
        }
      });

      // 2. Create Initial Ticket Message
      const initialMessage = await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          sender: 'CLIENT',
          authorName: data.clientName,
          text: data.description
        }
      });

      // 3. Create Notification for staff
      const notification = await tx.notification.create({
        data: {
          adminId: null, // Broadcast to all admins
          type: 'NEW_TICKET',
          payload: {
            ticketId: ticket.id,
            subject: ticket.subject,
            clientName: ticket.clientName,
            productName: product.title,
            priority: ticket.priority,
            source: 'EXTERNAL_API'
          },
          relatedTicketId: ticket.id
        }
      });

      return { ticket, initialMessage, notification };
    });

    // Fire Socket.io events after successful database commit
    emitTicketCreated(result.ticket);
    emitNotification(result.notification);

    logger.info(
      { ticketId: result.ticket.id, productId: product.id, source: 'EXTERNAL_API' },
      'Ingested ticket from external SaaS product'
    );

    return { ticketId: result.ticket.id };
  }

  /**
   * Ingest ticket from public web landing page form
   */
  static async createWebFormTicket(data, clientIp = '127.0.0.1') {
    // 1. Honeypot check: If the hidden honeypot field is filled by a spam bot, silently discard
    if (data._hp && data._hp.trim() !== '') {
      logger.warn({ clientIp }, 'Spam bot caught via honeypot field.');
      return { ticketId: 'bot-discarded' };
    }

    // 2. IP rate limiting: 15 tickets per 10 minutes per IP
    const rateLimit = await checkSlidingWindowRateLimit(`rl:ip:webform:${clientIp}`, 15, 600);
    if (!rateLimit.allowed) {
      const error = new Error('Too many requests. Please wait a few minutes before submitting again.');
      error.statusCode = 429;
      throw error;
    }

    let product = null;
    if (data.productId) {
      product = await prisma.product.findUnique({
        where: { id: data.productId }
      });
    }

    const productName = product?.title || data.productNameSnapshot || 'General Support';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Ticket record
      const ticket = await tx.ticket.create({
        data: {
          productId: product ? product.id : null,
          productNameSnapshot: productName,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          subject: data.subject,
          description: data.description,
          priority: data.priority,
          status: 'OPEN',
          source: 'PUBLIC_FORM'
        },
        include: {
          product: {
            select: { id: true, title: true, category: true, badgeColor: true }
          },
          assignedAdmin: true,
          _count: {
            select: { messages: true }
          }
        }
      });

      // 2. Create Initial Ticket Message
      const initialMessage = await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          sender: 'CLIENT',
          authorName: data.clientName,
          text: data.description
        }
      });

      // 3. Create Notification for staff
      const notification = await tx.notification.create({
        data: {
          adminId: null, // Broadcast
          type: 'NEW_TICKET',
          payload: {
            ticketId: ticket.id,
            subject: ticket.subject,
            clientName: ticket.clientName,
            productName,
            priority: ticket.priority,
            source: 'PUBLIC_FORM'
          },
          relatedTicketId: ticket.id
        }
      });

      return { ticket, initialMessage, notification };
    });

    // Fire Socket.io events after successful database commit
    emitTicketCreated(result.ticket);
    emitNotification(result.notification);

    logger.info(
      { ticketId: result.ticket.id, source: 'PUBLIC_FORM' },
      'Ingested ticket from public web form'
    );

    return { ticketId: result.ticket.id };
  }
}
