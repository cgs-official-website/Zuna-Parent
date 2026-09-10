import { Router } from 'express';
import { TicketsController } from './tickets.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

// Protect all admin ticket routes
router.use(requireAuth);

router.get('/', TicketsController.listTickets);
router.get('/export', TicketsController.exportTickets);
router.get('/:id', TicketsController.getTicketById);
router.patch('/:id', TicketsController.updateTicket);
router.post('/:id/messages', TicketsController.addMessage);
router.post('/:id/notify-agent', TicketsController.notifyAgent);

export default router;
