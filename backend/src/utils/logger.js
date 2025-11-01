// logger.js

// Xử lý log hệ thống.

// Chức năng:
// Log thông tin, cảnh báo, lỗi ra console hoặc file.
// Có thể dùng winston hoặc pino để quản lý log theo level.
// Giúp debug và theo dõi trạng thái server.

const { createLogger, transports, format } = require("winston");

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    // Ghi log ra console
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          ({ level, message, timestamp, stack }) =>
            `[${timestamp}] ${level}: ${stack || message}`
        )
      ),
    }),
    // Ghi log lỗi ra file riêng (nếu muốn)
    new transports.File({ filename: "logs/error.log", level: "error" }),
  ],
});

module.exports = logger;
