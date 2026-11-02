import { apiClient } from './apiClient.js';

export const normalizeProduct = (item) => {
  if (!item || typeof item !== 'object') return item;
  const displayName = item.title || item.name || '';
  return {
    ...item,
    name: displayName,
    title: displayName
  };
};

export const normalizeProducts = (data) => {
  if (Array.isArray(data)) {
    return data.map(normalizeProduct);
  }
  if (data && Array.isArray(data.data)) {
    return data.data.map(normalizeProduct);
  }
  if (data && Array.isArray(data.products)) {
    return data.products.map(normalizeProduct);
  }
  return [];
};

export const productsService = {
  async listProducts() {
    const response = await apiClient.get('/admin/products');
    return normalizeProducts(response.data?.data || response.data);
  },

  async createProduct(data) {
    const response = await apiClient.post('/admin/products', data);
    return normalizeProduct(response.data?.data || response.data);
  },

  async updateProduct(id, data) {
    const response = await apiClient.patch(`/admin/products/${id}`, data);
    return normalizeProduct(response.data?.data || response.data);
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
    return normalizeProducts(response.data?.data || response.data);
  },

  async getProducts() {
    return this.getPublicProducts();
  }
};
