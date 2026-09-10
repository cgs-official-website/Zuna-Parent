import { Router } from 'express';
import { ApiKeyController } from './apiKey.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

// Only SUPER_ADMIN can view or rotate product API keys
router.use(requireAuth);
router.use(requireRole('SUPER_ADMIN'));

router.post('/:id/api-key', ApiKeyController.generateProductApiKey);
router.get('/:id/api-keys', ApiKeyController.listProductApiKeys);

export default router;
