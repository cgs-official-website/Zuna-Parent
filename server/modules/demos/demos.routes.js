import { Router } from 'express';
import { DemosController } from './demos.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

// Protect admin demo request routes
router.use(requireAuth);

router.get('/', DemosController.listDemoRequests);
router.get('/:id', DemosController.getDemoRequestById);
router.patch('/:id', DemosController.updateDemoRequest);
router.delete('/:id', DemosController.deleteDemoRequest);

export default router;
