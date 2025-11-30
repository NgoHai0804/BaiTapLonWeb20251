// user.routes.js
// Quản lý thông tin người dùng.

// Chức năng chính:
// GET /profile/:id – lấy thông tin hồ sơ.
// PUT /profile – cập nhật thông tin, avatar.
// GET /leaderboard – (tùy chọn) bảng xếp hạng người chơi.

const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth.middleware");
const userController = require("../controllers/user.controller");

// Cần đăng nhập (middleware auth)
router.get("/profile", verifyToken, userController.getProfile);
router.get("/profile/:userId", verifyToken, userController.getUserProfile);
router.put("/profile", verifyToken, userController.updateProfile);
router.get("/leaderboard", userController.getLeaderboard);

module.exports = router;
