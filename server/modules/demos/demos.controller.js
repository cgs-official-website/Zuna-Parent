import { DemosService } from './demos.service.js';
import {
  createDemoRequestSchema,
  updateDemoRequestSchema,
  queryDemoRequestSchema
} from './demos.validator.js';

export class DemosController {
  static async createPublicDemoRequest(req, res, next) {
    try {
      const validated = createDemoRequestSchema.parse(req.body);
      const demo = await DemosService.createDemoRequest(validated);
      return res.status(201).json({
        success: true,
        data: demo
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

  static async listDemoRequests(req, res, next) {
    try {
      const query = queryDemoRequestSchema.parse(req.query);
      const result = await DemosService.listDemoRequests(query);
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta
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

  static async getDemoRequestById(req, res, next) {
    try {
      const { id } = req.params;
      const demo = await DemosService.getDemoRequestById(id);
      return res.status(200).json({
        success: true,
        data: demo
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateDemoRequest(req, res, next) {
    try {
      const { id } = req.params;
      const validated = updateDemoRequestSchema.parse(req.body);
      const updated = await DemosService.updateDemoRequest(id, validated);
      return res.status(200).json({
        success: true,
        data: updated
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

  static async deleteDemoRequest(req, res, next) {
    try {
      const { id } = req.params;
      const result = await DemosService.deleteDemoRequest(id);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
