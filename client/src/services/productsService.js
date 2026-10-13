import { apiClient } from './apiClient.js';

export const productsService = {
  async listProducts() {
    const response = await apiClient.get('/admin/products');
    return response.data?.data || response.data;
  },

  async createProduct(data) {
    const response = await apiClient.post('/admin/products', data);
    return response.data?.data || response.data;
  },

  async updateProduct(id, data) {
    const response = await apiClient.patch(`/admin/products/${id}`, data);
    return response.data?.data || response.data;
  },

  async deleteProduct(id) {
    const response = await apiClient.delete(`/admin/products/${id}`);
    return response.data?.data || response.data;
  },

  async generateApiKey(productId, name) {
    const response = await apiClient.post(`/admin/products/${productId}/api-keys`, { name });
    return response.data?.data || response.data;
  },

  async getPublicProducts() {
    const response = await apiClient.get('/public/products');
    return response.data?.data || response.data;
  },

  async getProducts() {
    return this.getPublicProducts();
  }
};
