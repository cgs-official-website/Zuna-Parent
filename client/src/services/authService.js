import { apiClient, setAccessToken } from './apiClient.js';

export const authService = {
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    const data = response.data?.data || response.data;
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
    }
    return data;
  },

  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data?.data?.user || response.data?.user || response.data?.data;
  },

  async refresh() {
    const response = await apiClient.post('/auth/refresh');
    const data = response.data?.data || response.data;
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
    }
    return data;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  }
};
