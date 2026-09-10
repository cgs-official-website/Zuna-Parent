import { IngestionService } from './ingestion.service.js';
import { externalTicketSchema, webFormTicketSchema } from './ingestion.validator.js';

export class IngestionController {
  static async createExternalTicket(req, res, next) {
    try {
      const validated = externalTicketSchema.parse(req.body);
      const result = await IngestionService.createExternalTicket(req.product, validated);

      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
      }
      next(error);
    }
  }

  static async createWebFormTicket(req, res, next) {
    try {
      const validated = webFormTicketSchema.parse(req.body);
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const result = await IngestionService.createWebFormTicket(validated, clientIp);

      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
      }
      next(error);
    }
  }
}
