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

export const friendApi = {
  getFriends: async () => {
    const response = await api.get('/api/friend');
    return response.data;
  },

  sendRequest: async (addresseeId) => {
    const response = await api.post('/api/friend/request', { addresseeId });
    return response.data;
  },

  getRequests: async () => {
    const response = await api.get('/api/friend/requests');
    // Backend trả về { success: true, message, data }
    return response.data.data || response.data;
  },

  acceptRequest: async (requesterId) => {
    const response = await api.post('/api/friend/accept', { requesterId });
    return response.data;
  },

  cancelRequest: async (requesterId) => {
    const response = await api.post('/api/friend/cancel', { requesterId });
    return response.data;
  },

  searchUser: async (nickname, userID) => {
    const response = await api.post('/api/friend/search', { nickname, userID });
    return response.data;
  },

  removeFriend: async (friendId) => {
    const response = await api.post('/api/friend/unfriend', { friendId });
    return response.data;
  },
};

export default friendApi;
