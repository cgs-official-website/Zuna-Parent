import { apiClient } from './apiClient.js';

export const demoService = {
  async listDemoRequests() {
    const response = await apiClient.get('/admin/demo-requests');
    return response.data?.data || response.data;
  },

  async updateDemoRequest(id, data) {
    const response = await apiClient.patch(`/admin/demo-requests/${id}`, data);
    return response.data?.data || response.data;
  },

  async submitPublicDemo(data) {
    const response = await apiClient.post('/public/demo-requests', data);
    return response.data?.data || response.data;
  },

  async addDemoRequest(data) {
    return this.submitPublicDemo(data);
  }
};
