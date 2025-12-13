import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../utils/constants';

export const authApi = {
  login: async (credentials) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data.data || response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    return response.data.data || response.data;
  },

  logout: async () => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    return response.data;
  },

  refresh: async () => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH);
    return response.data;
  },
};

export default authApi;

