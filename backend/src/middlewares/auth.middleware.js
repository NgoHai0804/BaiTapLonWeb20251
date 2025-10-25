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
    if (!req.header("Authorization")) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
