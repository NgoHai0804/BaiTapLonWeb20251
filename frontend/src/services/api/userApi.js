import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  let token = localStorage.getItem('auth_token');
  
  if (token) {
    // Loại bỏ dấu ngoặc kép nếu có
    token = token.replace(/^"(.*)"$/, '$1');
    // Loại bỏ khoảng trắng thừa
    token = token.trim();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const userApi = {
  getProfile: async () => {
    const response = await api.get('/api/users/profile');
    // Backend trả về { success: true, message, data }
    return response.data.data || response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/api/users/profile', data);
    // Backend trả về { success: true, message, data }
    return response.data.data || response.data;
  },

  changePassword: async (data) => {
    const response = await api.post('/api/users/change-password', data);
    return response.data.data || response.data;
  },

  getLeaderboard: async (gameId = 'caro') => {
    const response = await api.get(`/api/users/leaderboard?gameId=${gameId}`);
    return response.data.data || response.data;
  },

  getUserProfile: async (userId) => {
    const response = await api.get(`/api/users/profile/${userId}`);
    return response.data.data || response.data;
  },
};

export default userApi;
