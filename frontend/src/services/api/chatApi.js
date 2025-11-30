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

export const chatApi = {
  getRoomChat: async (roomId) => {
    const response = await api.get(`/api/chat/room/${roomId}`);
    return response.data;
  },

  getPrivateChat: async (userId) => {
    const response = await api.get(`/api/chat/private/${userId}`);
    // Backend trả về { success: true, message, data }
    return response.data.data || response.data;
  },

  markAsRead: async (chatId) => {
    const response = await api.post(`/api/chat/read/${chatId}`);
    return response.data;
  },
};

export default chatApi;
