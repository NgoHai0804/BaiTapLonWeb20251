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

const API_ENDPOINTS = {
  LIST: '/api/rooms/list',
  CREATE: '/api/rooms/create',
  JOIN: '/api/rooms/join',
  LEAVE: '/api/rooms/leave',
  GET: (id) => `/api/rooms/${id}`,
};

export const roomApi = {
  getRooms: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.LIST, { params });
    return response.data.data || response.data;
  },

  createRoom: async (roomData) => {
    try {
      const response = await api.post(API_ENDPOINTS.CREATE, roomData);
      // Backend trả về { success: true, data: {...}, message: "..." }
      if (response.data.success && response.data.data) {
        return { room: response.data.data };
      }
      // Fallback
      return { room: response.data.data || response.data };
    } catch (error) {
      console.error('createRoom API error:', error);
      throw error;
    }
  },

  joinRoom: async (roomId, password = '') => {
    const response = await api.post(API_ENDPOINTS.JOIN, { roomId, password });
    return response.data.data || response.data;
  },

  leaveRoom: async (roomId) => {
    const response = await api.post(API_ENDPOINTS.LEAVE, { roomId });
    return response.data.data || response.data;
  },

  getRoom: async (roomId) => {
    const response = await api.get(API_ENDPOINTS.GET(roomId));
    return response.data.data || response.data;
  },
};

export default roomApi;
