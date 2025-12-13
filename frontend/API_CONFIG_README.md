# Hướng dẫn cấu hình Server API

## Tổng quan

Cấu hình server API đã được tập trung hóa để dễ dàng thay đổi. Tất cả các file API và Socket client đều sử dụng cấu hình chung từ `src/config/api.config.js`.

## Cách thay đổi Server

### Cách 1: Sử dụng biến môi trường (Khuyến nghị)

1. Tạo file `.env` trong thư mục `frontend/`
2. Thêm các biến sau:

```env
# URL của API Server
VITE_API_URL=http://localhost:3000

# URL của Socket Server (tùy chọn, nếu không set sẽ dùng VITE_API_URL)
VITE_SOCKET_URL=http://localhost:3000
```

3. Khởi động lại dev server để áp dụng thay đổi

### Cách 2: Thay đổi trực tiếp trong code

Mở file `src/config/api.config.js` và thay đổi giá trị mặc định:

```javascript
export const API_URL = 'http://your-server:port';
export const SOCKET_URL = 'http://your-socket-server:port';
```

## Cấu trúc

- **`src/config/api.config.js`**: File cấu hình tập trung cho API và Socket URL
- **`src/services/api/apiClient.js`**: Axios instance chung với interceptor tự động thêm token
- **`src/services/api/*.js`**: Các file API sử dụng `apiClient` chung
- **`src/services/socket/socketClient.js`**: Socket client sử dụng config chung

## Lợi ích

✅ Dễ dàng thay đổi server chỉ bằng cách sửa một file  
✅ Không cần sửa nhiều file khi chuyển môi trường (dev/staging/production)  
✅ Tự động thêm token vào tất cả API requests  
✅ Hỗ trợ biến môi trường để bảo mật tốt hơn  

## Ví dụ sử dụng

### Development
```env
VITE_API_URL=http://localhost:3000
```

### Production
```env
VITE_API_URL=https://api.yourdomain.com
VITE_SOCKET_URL=wss://socket.yourdomain.com
```

### Staging
```env
VITE_API_URL=https://staging-api.yourdomain.com
```

