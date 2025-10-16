// auth.middleware.js

// Kiểm tra token JWT để xác thực người dùng.

// Chức năng chính:

// Lấy token từ header (Authorization hoặc cookie).

// Xác minh tính hợp lệ của JWT.

// Nếu hợp lệ → thêm req.user (thông tin người dùng).

// Nếu không → trả lỗi 401 Unauthorized.

// Áp dụng cho các route yêu cầu đăng nhập (ví dụ /rooms, /friends).