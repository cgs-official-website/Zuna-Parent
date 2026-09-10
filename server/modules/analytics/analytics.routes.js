import { Router } from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

// Protect all analytics endpoints
router.use(requireAuth);

router.get('/kpis', AnalyticsController.getKPISummary);
router.get('/charts', AnalyticsController.getChartsData);

export default router;
