import { AnalyticsService } from './analytics.service.js';
import { chartsQuerySchema } from './analytics.validator.js';

export class AnalyticsController {
  static async getKPISummary(req, res, next) {
    try {
      const kpis = await AnalyticsService.getKPISummary();
      return res.status(200).json({
        success: true,
        data: kpis
      });
    } catch (error) {
      next(error);
    }
  }

  static async getChartsData(req, res, next) {
    try {
      const query = chartsQuerySchema.parse(req.query);
      const charts = await AnalyticsService.getChartsData(query.range);
      return res.status(200).json({
        success: true,
        data: charts
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
