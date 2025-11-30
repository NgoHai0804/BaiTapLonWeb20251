// user.controller.js
// Quản lý thông tin người dùng và hồ sơ cá nhân.
// Chức năng:
// - Lấy thông tin chi tiết người dùng theo ID hoặc token.
// - Cập nhật thông tin cá nhân, avatar.
// - Cung cấp dữ liệu cho leaderboard (nếu có).

const response = require("../utils/response");
const userService = require("../services/user.service");
const logger = require("../utils/logger");

// Lấy thông tin profile người dùng
async function getProfile(req, res) {
  try {
    const user = await userService.getUserProfile(req.user._id);

    if (!user) return response.error(res, "User not found", 404);

    return response.success(res, user, "Get profile success");
  } catch (err) {
    logger.error(`getProfile error: ${err}`);
    return response.error(res, err.message, 500);
  }
}

// Cập nhật profile
async function updateProfile(req, res) {
  try {
    const updatedUser = await userService.updateUserProfile(req.user._id, req.body);

    if (!updatedUser)
      return response.error(res, "Update failed", 400);

    return response.success(res, updatedUser, "Update profile success");
  } catch (err) {
    logger.error(`updateProfile error: ${err}`);
    return response.error(res, err.message, 400);
  }
}

// Lấy thông tin profile của user khác
async function getUserProfile(req, res) {
  try {
    const { userId } = req.params;
    const user = await userService.getUserProfile(userId);

    if (!user) return response.error(res, "User not found", 404);

    return response.success(res, user, "Get user profile success");
  } catch (err) {
    logger.error(`getUserProfile error: ${err}`);
    return response.error(res, err.message, 500);
  }
}

// Lấy leaderboard
async function getLeaderboard(req, res) {
  try {
    const users = await userService.getLeaderboard(req.query.gameId);
    return response.success(res, users, "Get leaderboard success");
  } catch (err) {
    logger.error(`getLeaderboard error: ${err}`);
    return response.error(res, err.message, 500);
  }
}

module.exports = {
  getProfile,
  getUserProfile,
  updateProfile,
  getLeaderboard,
};
