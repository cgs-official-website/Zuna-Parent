import { apiClient } from './apiClient.js';

export const billingService = {
  async listSubscriptions() {
    const response = await apiClient.get('/admin/billing/subscriptions');
    return response.data?.data || response.data;
  },

  async listInvoices() {
    const response = await apiClient.get('/admin/billing/invoices');
    return response.data?.data || response.data;
  },

  async markInvoicePaid(id) {
    const response = await apiClient.post(`/admin/billing/invoices/${id}/mark-paid`);
    return response.data?.data || response.data;
  }
};
