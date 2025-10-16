// error.middleware.js

// Xử lý toàn bộ lỗi phát sinh trong ứng dụng.

// Chức năng chính:

// Bắt mọi lỗi (từ controller, service, hoặc hệ thống).

// Gửi response thống nhất: { status, message, stack (dev) }.

// Log lỗi ra console hoặc file log.

// Đảm bảo server không crash khi lỗi xảy ra.