// auth.middleware.js

// Kiểm tra token JWT để xác thực người dùng.

// Chức năng chính:

// Lấy token từ header (Authorization hoặc cookie).

// Xác minh tính hợp lệ của JWT.

// Nếu hợp lệ → thêm req.user (thông tin người dùng).

// Nếu không → trả lỗi 401 Unauthorized.

// Áp dụng cho các route yêu cầu đăng nhập (ví dụ /rooms, /friends).
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔧 Chuẩn hóa thông tin user để các nơi khác luôn dùng _id
    req.user = {
      _id: decoded._id || decoded.id,
      username: decoded.username,
      email: decoded.email,
    };

    if (!req.user._id)
      return res
        .status(401)
        .json({ success: false, message: "Token invalid: missing user id" });

    next();
  } catch (err) {
    console.error("auth.middleware error:", err);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
