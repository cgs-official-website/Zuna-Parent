import { prisma } from '../../lib/prisma.js';
import { emailService } from '../../lib/email.js';
import { emitTicketUpdated, emitTicketMessage } from '../../lib/socket.js';
import PDFDocument from 'pdfkit';

export class TicketsService {
  /**
   * Build Prisma where clause from query filters
   */
  static buildWhereClause(filters = {}) {
    const andConditions = [];

    if (filters.status && String(filters.status).toLowerCase() !== 'all') {
      const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
      const upper = String(filters.status).toUpperCase();
      if (validStatuses.includes(upper)) {
        andConditions.push({ status: upper });
      }
    }

    if (filters.priority && String(filters.priority).toLowerCase() !== 'all') {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      const upper = String(filters.priority).toUpperCase();
      if (validPriorities.includes(upper)) {
        andConditions.push({ priority: upper });
      }
    }

    const prodFilter = filters.product || filters.productId || filters.product_id;
    if (prodFilter && String(prodFilter).toLowerCase() !== 'all') {
      andConditions.push({
        OR: [
          { productId: String(prodFilter) },
          { productNameSnapshot: { contains: String(prodFilter), mode: 'insensitive' } }
        ]
      });
    }

    if (filters.assignedAdminId && String(filters.assignedAdminId).toLowerCase() !== 'all') {
      if (filters.assignedAdminId === 'unassigned') {
        andConditions.push({ assignedAdminId: null });
      } else {
        andConditions.push({ assignedAdminId: String(filters.assignedAdminId) });
      }
    }

    if (filters.search && filters.search.trim()) {
      const query = filters.search.trim();
      andConditions.push({
        OR: [
          { subject: { contains: query, mode: 'insensitive' } },
          { clientName: { contains: query, mode: 'insensitive' } },
          { clientEmail: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      });
    }

    return andConditions.length > 0 ? { AND: andConditions } : {};
  }

  /**
   * Paginated list of tickets with filters
   */
  static async listTickets({ page = 1, limit = 20, ...filters }) {
    const where = this.buildWhereClause(filters);
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, title: true, category: true, badgeColor: true }
          },
          assignedAdmin: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true }
          },
          _count: {
            select: { messages: true }
          }
        }
      }),
      prisma.ticket.count({ where })
    ]);

    return {
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total
      }
    };
  }

  /**
   * Get single ticket by ID with full conversation messages
   */
  static async getTicketById(id) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        product: true,
        assignedAdmin: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      const error = new Error(`Ticket with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    return ticket;
  }

  /**
   * Update ticket status, priority, or assigned admin
   */
  static async updateTicket(id, updateData) {
    const existing = await this.getTicketById(id);

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        product: true,
        assignedAdmin: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true }
        },
        _count: {
          select: { messages: true }
        }
      }
    });

    // If assigned admin changed to a new admin, trigger email notification
    if (
      updateData.assignedAdminId &&
      updateData.assignedAdminId !== existing.assignedAdminId &&
      updated.assignedAdmin
    ) {
      emailService.sendTicketAssignmentEmail({
        ticket: updated,
        agentName: updated.assignedAdmin.name,
        agentEmail: updated.assignedAdmin.email
      }).catch(() => {});
    }

    // Emit realtime update to Socket.io tickets room
    emitTicketUpdated(updated);

    return updated;
  }

  /**
   * Post an admin reply to a ticket thread
   */
  static async addMessage(id, admin, text) {
    const ticket = await this.getTicketById(id);

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        sender: 'ADMIN',
        authorName: admin.name,
        text
      }
    });

    // If ticket was OPEN, optionally progress to IN_PROGRESS
    if (ticket.status === 'OPEN') {
      await prisma.ticket.update({
        where: { id },
        data: { status: 'IN_PROGRESS' }
      });
    }

    // Trigger Resend email to client asynchronously
    emailService.sendClientReplyEmail({
      ticket,
      clientEmail: ticket.clientEmail,
      authorName: admin.name,
      text
    }).catch(() => {});

    // Emit realtime message event to Socket.io tickets room
    emitTicketMessage(id, message);

    return message;
  }

  /**
   * Stream tickets as CSV to HTTP response (O(1) memory usage)
   */
  static async streamExportCSV(filters, res) {
    const where = this.buildWhereClause(filters);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="zuna_tickets_${Date.now()}.csv"`
    );

    // CSV Header
    res.write('Ticket ID,Product,Client Name,Client Email,Subject,Priority,Status,Source,Assigned To,Created At\n');

    const BATCH_SIZE = 100;
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const batch = await prisma.ticket.findMany({
        where,
        take: BATCH_SIZE,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: 'asc' },
        include: {
          product: { select: { title: true } },
          assignedAdmin: { select: { name: true } }
        }
      });

      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      for (const t of batch) {
        const prod = t.product?.title || t.productNameSnapshot || 'General Support';
        const assigned = t.assignedAdmin?.name || 'Unassigned';
        const escape = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

        const row = [
          escape(t.id),
          escape(prod),
          escape(t.clientName),
          escape(t.clientEmail),
          escape(t.subject),
          escape(t.priority),
          escape(t.status),
          escape(t.source),
          escape(assigned),
          escape(t.createdAt.toISOString())
        ].join(',') + '\n';

        res.write(row);
      }

      cursor = batch[batch.length - 1].id;
      if (batch.length < BATCH_SIZE) {
        hasMore = false;
      }
    }

    res.end();
  }

  /**
   * Export filtered tickets as a styled PDF report
   */
  static async exportPDF(filters, res) {
    const where = this.buildWhereClause(filters);

    // Fetch up to 100 records for the PDF report view
    const tickets = await prisma.ticket.findMany({
      where,
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { title: true } },
        assignedAdmin: { select: { name: true } }
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="zuna_tickets_report_${Date.now()}.pdf"`
    );

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);

    // Title & Header
    doc.fontSize(20).fillColor('#0284c7').text('Zuna Central Admin — Tickets Report', { align: 'left' });
    doc.fontSize(10).fillColor('#64748b').text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${tickets.length}`, { align: 'left' });
    doc.moveDown(1);

    // Table Header
    const tableTop = 90;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a');
    doc.text('ID', 30, tableTop, { width: 60 });
    doc.text('Subject', 95, tableTop, { width: 140 });
    doc.text('Client', 240, tableTop, { width: 100 });
    doc.text('Priority', 345, tableTop, { width: 50 });
    doc.text('Status', 400, tableTop, { width: 60 });
    doc.text('Assigned', 465, tableTop, { width: 100 });

    doc.moveTo(30, tableTop + 15).lineTo(565, tableTop + 15).strokeColor('#cbd5e1').stroke();

    let y = tableTop + 22;
    doc.font('Helvetica').fontSize(8).fillColor('#334155');

    for (const ticket of tickets) {
      if (y > 770) {
        doc.addPage();
        y = 40;
      }

      const assigned = ticket.assignedAdmin?.name || 'Unassigned';
      doc.text(ticket.id.slice(0, 8) + '...', 30, y, { width: 60 });
      doc.text(ticket.subject.slice(0, 30), 95, y, { width: 140 });
      doc.text(`${ticket.clientName} (${ticket.clientEmail.slice(0, 14)})`, 240, y, { width: 100 });
      doc.text(ticket.priority, 345, y, { width: 50 });
      doc.text(ticket.status, 400, y, { width: 60 });
      doc.text(assigned.slice(0, 18), 465, y, { width: 100 });

      y += 18;
    }

    // Footer
    doc.fontSize(8).fillColor('#94a3b8').text('Confidential • Zuna Support Management Hub', 30, 800, { align: 'center', width: 535 });

    doc.end();
  }
}
