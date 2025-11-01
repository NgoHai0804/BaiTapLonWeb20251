// auth.controller.js
// Xử lý xác thực và quản lý tài khoản
// - Đăng ký, đăng nhập
// - Hash mật khẩu
// - JWT
// - Response format thống nhất

const authService = require("../services/auth.service");
const response = require("../utils/response");
const logger = require("../utils/logger");


// register
async function register(req, res) {
  try {
    const result = await authService.register(req.body);

    // Nếu service trả về lỗi (username/nickname tồn tại hoặc dữ liệu không hợp lệ)
    if (result.error) {
      return response.error(res, result.error, result.code || 400);
    }

    // Thành công
    return response.success(res, result.data, "Registered successfully");
  } catch (err) {
    logger.error(`register error: ${err}`);
    return response.error(res, "Internal server error", 500);
  }
}


// Login
async function login(req, res) {
  try {
    const result = await authService.login(req.body);

    if (result.error) {
      // Dùng response.js với code trả về từ service
      return response.error(res, result.error, result.code || 400);
    }

    return response.success(res, result.data, "Login successfully");
  } catch (err) {
    logger.error(`login error: ${err}`);
    return response.error(res, "Internal server error", 500);
  }
}


module.exports = {
  register,
  login,
};
