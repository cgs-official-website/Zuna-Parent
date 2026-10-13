import { apiClient } from './apiClient.js';

export const notificationsService = {
  async listNotifications() {
    const response = await apiClient.get('/admin/notifications');
    return response.data?.data || response.data;
  },

  async markAsRead(id) {
    const response = await apiClient.patch(`/admin/notifications/${id}/read`);
    return response.data?.data || response.data;
  },

  async markAllAsRead() {
    const response = await apiClient.post('/admin/notifications/mark-all-read');
    return response.data?.data || response.data;
  }
};
