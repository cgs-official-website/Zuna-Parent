import { Router } from 'express';
import { IngestionController } from './ingestion.controller.js';
import { apiKeyAuth } from '../../middleware/apiKeyAuth.js';

const router = Router();

// External product ticket ingestion (requires signed X-Api-Key)
router.post('/', apiKeyAuth, IngestionController.createExternalTicket);

// Landing page public web form submission
router.post('/from-web-form', IngestionController.createWebFormTicket);

export default router;
