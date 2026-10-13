import { apiClient } from './apiClient.js';

export const teamService = {
  async listTeam() {
    const response = await apiClient.get('/admin/team');
    return response.data?.data || response.data;
  },

  async inviteMember(data) {
    const response = await apiClient.post('/admin/team', data);
    return response.data?.data || response.data;
  },

  async updateMember(id, data) {
    const response = await apiClient.patch(`/admin/team/${id}`, data);
    return response.data?.data || response.data;
  },

  async deleteMember(id) {
    const response = await apiClient.delete(`/admin/team/${id}`);
    return response.data?.data || response.data;
  },

  async getRoles() {
    const response = await apiClient.get('/admin/team/roles');
    return response.data?.data || response.data;
  },

  async createRole(data) {
    const response = await apiClient.post('/admin/team/roles', data);
    return response.data?.data || response.data;
  }
};
