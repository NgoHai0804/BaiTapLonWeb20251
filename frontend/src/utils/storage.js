// storage.js

// Wrapper cho localStorage (và có thể thêm sessionStorage) — giúp code an toàn, dễ debug, và tránh lỗi khi parse JSON.

// Nhiệm vụ chính:

// Lưu, đọc, xóa dữ liệu từ localStorage.

// Tự động parse và stringify JSON.

// Có thể mở rộng thêm TTL (thời gian hết hạn).

// Ví dụ công dụng:

// Lưu token đăng nhập.

// Ghi nhớ cài đặt người dùng (âm thanh, theme,…).

// Cache danh sách bạn bè hoặc phòng gần nhất.

// Hàm gợi ý:

// storage.set("token", token);
// const token = storage.get("token");
// storage.remove("token");
// storage.clearAll();