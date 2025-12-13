import apiClient from './apiClient';

export const userApi = {
  getProfile: async () => {
    const response = await apiClient.get('/api/users/profile');
    // Backend trả về { success: true, message, data }
    return response.data.data || response.data;
  },

  updateProfile: async (data) => {
    const response = await apiClient.put('/api/users/profile', data);
    // Backend trả về { success: true, message, data }
    return response.data.data || response.data;
  },

  changePassword: async (data) => {
    const response = await apiClient.post('/api/users/change-password', data);
    return response.data.data || response.data;
  },

  getLeaderboard: async (gameId = 'caro') => {
    const response = await apiClient.get(`/api/users/leaderboard?gameId=${gameId}`);
    // Backend trả về { success: true, message, data }
    const data = response.data.data || response.data;
    // Đảm bảo luôn trả về array
    return Array.isArray(data) ? data : [];
  },

  getUserProfile: async (userId) => {
    const response = await apiClient.get(`/api/users/profile/${userId}`);
    return response.data.data || response.data;
  },
};

export default userApi;
