import { prisma } from '../../lib/prisma.js';

export class NotificationsService {
  /**
   * List notifications for an admin (targeted + global broadcasts)
   */
  static async listNotifications(adminId, { unreadOnly = false, limit = 50 }) {
    const where = {
      OR: [{ adminId }, { adminId: null }]
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({
        where: {
          OR: [{ adminId }, { adminId: null }],
          isRead: false
        }
      })
    ]);

    // Format for frontend convenience (title, text, unread, icon, path)
    const formatted = notifications.map((n) => {
      const payload = typeof n.payload === 'object' && n.payload !== null ? n.payload : {};
      let title = payload.title;
      let text = payload.text;
      let icon = payload.icon || 'Bell';
      let path = payload.path || '/admin/dashboard/tickets';

      if (!title) {
        switch (n.type) {
          case 'NEW_TICKET':
            title = 'New Support Ticket';
            text = `${payload.clientName || 'A customer'} raised ticket: "${payload.subject || 'Support issue'}"`;
            icon = 'AlertCircle';
            path = '/admin/dashboard/tickets';
            break;
          case 'TICKET_REPLY':
            title = 'New Ticket Reply';
            text = `${payload.authorName || 'User'} replied to ticket #${n.relatedTicketId || ''}`;
            icon = 'MessageSquare';
            path = '/admin/dashboard/tickets';
            break;
          case 'NEW_DEMO_REQUEST':
            title = 'New Demo Request';
            text = `${payload.contactName || 'Lead'} (${payload.companyName || 'Company'}) requested a demo`;
            icon = 'Calendar';
            path = '/admin/dashboard/demo-requests';
            break;
          case 'SLA_WARNING':
            title = 'SLA Warning';
            text = payload.message || 'Ticket is approaching SLA breach threshold';
            icon = 'Clock';
            path = '/admin/dashboard/tickets';
            break;
          default:
            title = 'System Notification';
            text = payload.message || '';
        }
      }

      return {
        id: n.id,
        type: n.type,
        title,
        text,
        icon,
        path,
        unread: !n.isRead,
        isRead: n.isRead,
        payload,
        relatedTicketId: n.relatedTicketId,
        relatedDemoRequestId: n.relatedDemoRequestId,
        createdAt: n.createdAt
      };
    });

    return {
      data: formatted,
      unreadCount
    };
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(id, adminId) {
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      const error = new Error(`Notification with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return {
      id: updated.id,
      isRead: true,
      unread: false
    };
  }

  /**
   * Mark all visible notifications as read for the authenticated admin
   */
  static async markAllAsRead(adminId) {
    const result = await prisma.notification.updateMany({
      where: {
        OR: [{ adminId }, { adminId: null }],
        isRead: false
      },
      data: { isRead: true }
    });

    return {
      updatedCount: result.count
    };
  }

  /**
   * Delete notification
   */
  static async deleteNotification(id) {
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      const error = new Error(`Notification with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }

    await prisma.notification.delete({
      where: { id }
    });

    return { id, deleted: true };
  }
}
