import { Router } from 'express';
import { NotificationsController } from './notifications.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

// Protect all notification routes
router.use(requireAuth);

router.get('/', NotificationsController.listNotifications);
router.patch('/read-all', NotificationsController.markAllAsRead);
router.patch('/:id/read', NotificationsController.markAsRead);
router.delete('/:id', NotificationsController.deleteNotification);

export default router;
