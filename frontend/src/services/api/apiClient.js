import axios from 'axios';
import { API_URL } from '../../config/api.config';

/**
 * Axios instance chung cho tất cả API calls
 * Tự động thêm token vào header nếu có
 */
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào request
apiClient.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('auth_token');
    
    if (token) {
      // Loại bỏ dấu ngoặc kép nếu có
      token = token.replace(/^"(.*)"$/, '$1');
      // Loại bỏ khoảng trắng thừa
      token = token.trim();
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Bypass ngrok warning page cho API requests (nếu đang dùng ngrok)
    if (config.baseURL?.includes('ngrok')) {
      config.headers['ngrok-skip-browser-warning'] = 'true';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý response
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi chung nếu cần
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      console.warn('Unauthorized - Token có thể đã hết hạn');
    }
    return Promise.reject(error);
  }
);

export default apiClient;

