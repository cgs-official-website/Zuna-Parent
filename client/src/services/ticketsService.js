import { apiClient } from './apiClient.js';

export const ticketsService = {
  async listTickets(params = {}) {
    const response = await apiClient.get('/admin/tickets', { params });
    return response.data?.data || response.data;
  },

  async getTicketById(id) {
    const response = await apiClient.get(`/admin/tickets/${id}`);
    return response.data?.data || response.data;
  },

  async updateTicket(id, data) {
    const response = await apiClient.patch(`/admin/tickets/${id}`, data);
    return response.data?.data || response.data;
  },

  async addMessage(id, text, isInternal = false) {
    const response = await apiClient.post(`/admin/tickets/${id}/messages`, {
      text,
      isInternal
    });
    return response.data?.data || response.data;
  },

  async notifyAgent(id) {
    const response = await apiClient.post(`/admin/tickets/${id}/notify-agent`);
    return response.data;
  },

  async exportTickets(format = 'csv') {
    const response = await apiClient.get('/admin/tickets/export', {
      params: { format },
      responseType: 'blob'
    });

    const blob = new Blob([response.data], {
      type: format === 'pdf' ? 'application/pdf' : 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zuna-tickets-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  async submitWebFormTicket(data) {
    const response = await apiClient.post('/public/tickets/from-web-form', data);
    return response.data?.data || response.data;
  },

  async addTicket(data) {
    return this.submitWebFormTicket({
      clientName: data.raisedBy?.name || data.clientName || data.name,
      clientEmail: data.raisedBy?.email || data.clientEmail || data.email,
      subject: data.subject,
      description: data.description,
      priority: data.priority,
      productId: data.productId,
      productNameSnapshot: data.productName || data.productNameSnapshot
    });
  }
};
