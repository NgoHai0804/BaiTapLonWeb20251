// auth.controller.js

// Xử lý toàn bộ quá trình xác thực và quản lý tài khoản.

// Chức năng:

// Kiểm tra dữ liệu đầu vào khi đăng ký/đăng nhập.

// Hash mật khẩu (bcrypt).

// Sinh và xác minh JWT.

// Xử lý đăng xuất hoặc làm mới token.

// Quản lý xác thực qua middleware (nếu có).

const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const { signToken } = require("../utils/jwt");

function checkData(value, lengthMin, lengthMax) {
  if (!value || value.length < lengthMin || value.length > lengthMax) {
    return false;
  }

  const specialCharRegex = /[^a-zA-Z0-9_]/;
  if (specialCharRegex.test(value)) {
    return false;
  }

  return true;
}

// POST /api/auth/register {username, password, nickname} -> Đăng ký
// Đăng ký
exports.register = async (req, res) => {
  try {
    const { username, password, nickname } = req.body; // Truyền vào cần username, password, nickname

    if (!checkData(username, 5, 15)) {
      return res.status(400).json({
        success: false,
        message:
          "Username is not valid. Length must be between 5 and 15 characters.",
      });
    }

    if (!checkData(password, 8, 20)) {
      return res.status(400).json({
        success: false,
        message:
          "Password is not valid. Length must be between 8 and 20 characters.",
      });
    }

    if (!checkData(nickname, 5, 15)) {
      return res.status(400).json({
        success: false,
        message:
          "Nickname is not valid. Length must be between 5 and 15 characters.",
      });
    }

    // Kiểm tra username trùng
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username already exists.",
      }); // user name đã tồn tại
    }

    const existingNickname = await User.findOne({ nickname });
    if (existingNickname) {
      return res.status(400).json({
        success: false,
        message: "Nickname already exists.",
      }); // nick name đã tồ tại
    }

    // Hash mật khẩu --> Bảo vệ mật khẩu
    const passwordHash = await bcrypt.hash(password, 10);

    // Tạo user
    const user = await User.create({
      username,
      passwordHash,
      nickname: nickname,
    });

    return res.json({
      success: true,
      message: "Registered successfully",
      user: { id: user._id, username: user.username, nickname: user.nickname },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// [POST] /api/auth/login {username, password}
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check username và password
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both username and password.",
      });
    }

    // Tìm user theo username
    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({
        success: false,
        message: "Wrong account or password.",
      });

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch)
      return res.status(400).json({
        success: false,
        message: "Wrong account or password.",
      });

    // Sinh JWT token
    const token = signToken(user);

    return res.json({
      success: true,
      message: "Login successfully.",
      token: token,
      data: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
