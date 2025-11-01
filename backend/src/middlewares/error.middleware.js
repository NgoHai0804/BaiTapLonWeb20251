// error.middleware.js

// Xử lý toàn bộ lỗi phát sinh trong ứng dụng.

// Chức năng chính:
// Bắt mọi lỗi (từ controller, service, hoặc hệ thống).
// Gửi response thống nhất: { status, message, stack (dev) }.
// Log lỗi ra console hoặc file log.
// Đảm bảo server không crash khi lỗi xảy ra.

// error.middleware.js
const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Ghi log chi tiết
  logger.error("[%s] %s - %s", req.method, req.originalUrl, message);
  if (process.env.NODE_ENV === "development" && err.stack) {
    console.error(err.stack);
  }

  // Trả response thống nhất
  res.status(statusCode).json({
    status: "error",
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};
