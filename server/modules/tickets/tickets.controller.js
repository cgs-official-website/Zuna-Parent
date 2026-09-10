import { TicketsService } from './tickets.service.js';
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
}
