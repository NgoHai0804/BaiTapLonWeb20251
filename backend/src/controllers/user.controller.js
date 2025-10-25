// user.controller.js

// Quản lý thông tin người dùng và hồ sơ cá nhân.

// Chức năng:

// Lấy thông tin chi tiết người dùng theo ID hoặc token.

// Cập nhật thông tin cá nhân, avatar.

// Cung cấp dữ liệu cho leaderboard (nếu có).

const User = require("../models/user.model");
const bcrypt = require("bcrypt");

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

// Lấy thông tin --> Dưa trên JWT token
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash"); // Loại bỏ trường passwordHash

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Cập nhật thông tin cá nhân
exports.updateProfile = async (req, res) => {
  try {
    const { nickname, avatarUrl, password } = req.body;
    const updateData = {};
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    if (!checkData(nickname, 5, 15)) {
      return res.status(400).json({
        success: false,
        message:
          "Nickname is not valid. Length must be between 5 and 15 characters.",
      });
    } else {
      updateData.nickname = nickname;
    }

    const existingNickname = await User.findOne({ nickname });
    if (existingNickname) {
      return res.status(400).json({
        success: false,
        message: "Nickname already exists.",
      }); // nick name đã tồ tại
    }

    if (!checkData(password, 8, 20)) {
      return res.status(400).json({
        success: false,
        message:
          "Password is not valid. Length must be between 5 and 15 characters.",
      });
    } else {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    }).select("-passwordHash");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy dữ liệu cho leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { gameId = "caro" } = req.query;

    const users = await User.find(
      { "gameStats.gameId": gameId },
      {
        username: 1,
        nickname: 1,
        avatarUrl: 1,
        "gameStats.$": 1,
      }
    )
      .sort({ "gameStats.score": -1 })
      .limit(20);

    res.json({ success: true, users });
  } catch (err) {
    console.error("❌ getLeaderboard error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
