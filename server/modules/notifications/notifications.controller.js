import { NotificationsService } from './notifications.service.js';
import { listNotificationsQuerySchema } from './notifications.validator.js';

export class NotificationsController {
  static async listNotifications(req, res, next) {
    try {
      const query = listNotificationsQuerySchema.parse(req.query);
      const result = await NotificationsService.listNotifications(req.admin.id, query);
      return res.status(200).json({
        success: true,
        data: result.data,
        unreadCount: result.unreadCount
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

  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const result = await NotificationsService.markAsRead(id, req.admin.id);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      const result = await NotificationsService.markAllAsRead(req.admin.id);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      const result = await NotificationsService.deleteNotification(id);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
