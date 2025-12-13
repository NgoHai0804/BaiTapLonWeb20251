/**
 * Cấu hình API và Socket Server
 * 
 * Có thể thay đổi server bằng cách:
 * 1. Tạo file .env trong thư mục frontend và thêm:
 *    VITE_API_URL=http://your-api-server:port
 *    VITE_SOCKET_URL=http://your-socket-server:port
 * 
 * 2. Hoặc thay đổi giá trị mặc định bên dưới
 */

// API Server URL - ưu tiên lấy từ biến môi trường
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Socket Server URL - ưu tiên lấy từ biến môi trường
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Export config object để dễ sử dụng
export const apiConfig = {
  apiUrl: API_URL,
  socketUrl: SOCKET_URL,
};

// Log config trong development để dễ debug
if (import.meta.env.DEV) {
  console.log('API Config:', {
    apiUrl: API_URL,
    socketUrl: SOCKET_URL,
    env: {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
    },
  });
}

