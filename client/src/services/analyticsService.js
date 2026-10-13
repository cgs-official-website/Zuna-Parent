import { apiClient } from './apiClient.js';

export const analyticsService = {
  async getKpis() {
    const response = await apiClient.get('/admin/analytics/kpis');
    return response.data?.data || response.data;
  },

  async getVolume(range = '30d') {
    const response = await apiClient.get('/admin/analytics/volume', {
      params: { range }
    });
    return response.data?.data || response.data;
  },

  async getDistribution() {
    const response = await apiClient.get('/admin/analytics/distribution');
    return response.data?.data || response.data;
  },

  async getPerformance() {
    const response = await apiClient.get('/admin/analytics/performance');
    return response.data?.data || response.data;
  }
};
