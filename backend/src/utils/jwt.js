// jwt.js
// Tiện ích liên quan đến JWT.

// Chức năng:
// Tạo token (signToken(payload)).
// Xác minh token (verifyToken(token)).
// Cấu hình thời hạn token, secret key từ config/jwt.js.
// Được middleware hoặc controller sử dụng.

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const JWT_EXPIRES_IN = "30d"; // token có hiệu lực 7 ngày

// Sinh JWT
exports.signToken = (user) => {
  return jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// Xác thực
exports.verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
