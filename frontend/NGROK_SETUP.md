# Hướng dẫn cấu hình với Ngrok

## Vấn đề

### 1. Ngrok Warning Page (ERR_NGROK_6024)
Khi truy cập ngrok URL, bạn sẽ thấy trang cảnh báo:
```
You are about to visit xxx.ngrok-free.app, served by IP. 
This website is served for free through ngrok.com. 
You should only visit this website if you trust whoever sent the link to you.
```

**Giải pháp:**
- Click vào nút **"Visit Site"** hoặc **"Continue"** để tiếp tục
- Đây là tính năng bảo mật của ngrok free tier, không phải lỗi

### 2. Vite Blocked Request
Vite có thể chặn request từ host ngrok với lỗi:
```
Blocked request. This host ("xxx.ngrok-free.app") is not allowed.
```

## Giải pháp

### 1. Cấu hình Vite (Đã được cấu hình sẵn)

File `vite.config.js` đã được cấu hình để cho phép các host ngrok:
- `5ab76e29a5b1.ngrok-free.app` (host cụ thể)
- `.ngrok-free.app` (tất cả subdomain ngrok mới)
- `.ngrok.io` (tất cả subdomain ngrok cũ)

### 2. Cấu hình API URL để kết nối với backend qua ngrok

Tạo file `.env` trong thư mục `frontend/`:

```env
# Nếu backend cũng chạy qua ngrok
VITE_API_URL=https://5ab76e29a5b1.ngrok-free.app
VITE_SOCKET_URL=https://5ab76e29a5b1.ngrok-free.app

# Hoặc nếu backend vẫn chạy local
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### 3. Chạy ngrok

#### Expose frontend (port 5173):
```bash
ngrok http 5173
```

#### Expose backend (port 3000):
```bash
ngrok http 3000
```

### 4. Cập nhật allowedHosts nếu cần

Nếu bạn có ngrok URL mới, cập nhật trong `vite.config.js`:

```javascript
server: {
  allowedHosts: [
    'your-new-ngrok-url.ngrok-free.app',
    'localhost',
    '.ngrok-free.app',
    '.ngrok.io',
  ],
}
```

### 5. Khởi động lại dev server

Sau khi cập nhật cấu hình, khởi động lại:
```bash
npm run dev
```

## Lưu ý

- Frontend chạy trên `http://localhost:5173` (local)
- Ngrok URL: `https://5ab76e29a5b1.ngrok-free.app` (public)
- Đảm bảo backend cũng được expose qua ngrok nếu cần truy cập từ bên ngoài
- Ngrok free có giới hạn về số lượng request và thời gian

## Troubleshooting

### Vẫn bị chặn sau khi cấu hình?
1. Kiểm tra lại `vite.config.js` có `allowedHosts` đúng không
2. Khởi động lại dev server
3. Xóa cache: `rm -rf node_modules/.vite`
4. Kiểm tra console để xem URL nào đang bị chặn

### Lỗi CORS?
- Đảm bảo backend đã cấu hình CORS để cho phép ngrok domain
- Kiểm tra `Access-Control-Allow-Origin` trong response headers

### Bypass Ngrok Warning Page (Tùy chọn)

Nếu muốn tự động bypass warning page của ngrok, bạn có thể:

#### Cách 1: Sử dụng ngrok với header (Cần ngrok account)
```bash
ngrok http 5173 --request-header-add "ngrok-skip-browser-warning: true"
```

#### Cách 2: Thêm header trong requests (Frontend)
Cập nhật `apiClient.js` để thêm header:
```javascript
apiClient.interceptors.request.use((config) => {
  // Bypass ngrok warning page
  config.headers['ngrok-skip-browser-warning'] = 'true';
  // ... rest of code
});
```

#### Cách 3: Sử dụng ngrok với domain tùy chỉnh (Ngrok paid plan)
```bash
ngrok http 5173 --domain=your-custom-domain.ngrok.io
```

**Lưu ý:** Warning page là tính năng bảo mật của ngrok free tier. Nếu chỉ dùng để test, chỉ cần click "Visit Site" là đủ.

