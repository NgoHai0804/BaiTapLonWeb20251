// auth.middleware.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    let token = authHeader.replace("Bearer ", "").trim();
    // Loại bỏ dấu ngoặc kép nếu có
    token = token.replace(/^"(.*)"$/, '$1');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Chuẩn hóa thông tin user để các nơi khác luôn dùng _id
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
