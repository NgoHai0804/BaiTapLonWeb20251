// auth.routes.js

// Quản lý xác thực người dùng.

// Chức năng chính:

// POST /register – đăng ký tài khoản mới.

// POST /login – đăng nhập, trả về JWT.

// GET /verify – kiểm tra token hợp lệ.

// POST /logout – đăng xuất (xóa token hoặc session).



const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Đăng ký
router.post('/register', authController.register);

// Đăng nhập
router.post('/login', authController.login);

module.exports = router;
