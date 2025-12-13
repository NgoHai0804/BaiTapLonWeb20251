import apiClient from './apiClient';

export const chatApi = {
  getRoomChat: async (roomId) => {
    const response = await apiClient.get(`/api/chat/room/${roomId}`);
    return response.data;
  },

  getPrivateChat: async (userId) => {
    const response = await apiClient.get(`/api/chat/private/${userId}`);
    // Backend trả về { success: true, message, data }
    return response.data.data || response.data;
  },

  markAsRead: async (chatId) => {
    const response = await apiClient.post(`/api/chat/read/${chatId}`);
    return response.data;
  },
};

export default chatApi;
