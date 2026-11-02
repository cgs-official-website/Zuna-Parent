import { TicketsService } from './tickets.service.js';
import { emailService } from '../../lib/email.js';
import {
  listTicketsQuerySchema,
  updateTicketSchema,
  createMessageSchema,
  exportTicketsQuerySchema
} from './tickets.validator.js';

export class TicketsController {
  static async listTickets(req, res, next) {
    try {
      const query = listTicketsQuerySchema.parse(req.query);
      const admin = req.admin;
      const isSuperAdmin = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN' || admin?.email === 'admin@zuna.com';
      
      // Non-super admin members only receive tickets assigned to them
      if (admin && !isSuperAdmin) {
        query.assignedAdminId = admin.id;
      }

      const result = await TicketsService.listTickets(query);
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation error', details: error.errors }
        });
      }
      next(error);
    }
  }

  static async getTicketById(req, res, next) {
    try {
      const { id } = req.params;
      const ticket = await TicketsService.getTicketById(id);
      const admin = req.admin;
      const isSuperAdmin = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN' || admin?.email === 'admin@zuna.com';

      // Non-super admin members can only access their assigned tickets
      if (admin && !isSuperAdmin && ticket.assignedAdminId !== admin.id) {
        return res.status(403).json({
          success: false,
          error: { message: 'You are only authorized to view tickets assigned to you.' }
        });
      }

      return res.status(200).json({
        success: true,
        data: ticket
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTicket(req, res, next) {
    try {
      const { id } = req.params;
      const body = updateTicketSchema.parse(req.body);
      const admin = req.admin;
      const isSuperAdmin = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN' || admin?.email === 'admin@zuna.com';

      // Regular staff cannot reassign tickets to other staff
      if (!isSuperAdmin) {
        delete body.assignedAdminId;
      }

      const updated = await TicketsService.updateTicket(id, body);
      return res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation error', details: error.errors }
        });
      }
      next(error);
    }
  }

  static async addMessage(req, res, next) {
    try {
      const { id } = req.params;
      const body = createMessageSchema.parse(req.body);
      const message = await TicketsService.addMessage(id, req.admin, body.text);
      return res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation error', details: error.errors }
        });
      }
      next(error);
    }
  }

  static async exportTickets(req, res, next) {
    try {
      const query = exportTicketsQuerySchema.parse(req.query);
      const admin = req.admin;
      const isSuperAdmin = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN' || admin?.email === 'admin@zuna.com';

      if (!isSuperAdmin) {
        query.assignedAdminId = admin.id;
      }

      if (query.format === 'pdf') {
        await TicketsService.exportPDF(query, res);
      } else {
        await TicketsService.streamExportCSV(query, res);
      }
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation error', details: error.errors }
        });
      }
      next(error);
    }
  }

  static async notifyAgent(req, res, next) {
    try {
      const { id } = req.params;
      const ticket = await TicketsService.getTicketById(id);
      if (!ticket.assignedAdmin || !ticket.assignedAdmin.email) {
        return res.status(400).json({
          success: false,
          error: { message: 'Ticket does not have an assigned team member with an email address.' }
        });
      }

      const result = await emailService.sendTicketAssignmentEmail({
        ticket,
        agentName: ticket.assignedAdmin.name,
        agentEmail: ticket.assignedAdmin.email
      });

      return res.status(200).json({
        success: result.success,
        message: result.success
          ? `Assignment notification email dispatched to ${ticket.assignedAdmin.email} via ${result.provider || 'Nodemailer'}`
          : `Failed to send email: ${result.error || result.reason}`,
        details: result
      });
    } catch (error) {
      next(error);
    }
  }
}
