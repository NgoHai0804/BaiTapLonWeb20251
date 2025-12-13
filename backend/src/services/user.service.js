// user.service.js
// Business logic for users: fetch/update profiles, nickname checks, leaderboard.

const User = require("../models/user.model");
const { checkData, hashPassword } = require("../utils/validation");
const logger = require("../utils/logger");

// Get user profile (excluding password hash)
const getUserProfile = async (userId) => {
  try {
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      logger.warn(`User not found: ${userId}`);
      throw new Error("User not found");
    }
    logger.info(`Fetched profile for user: ${userId}`);
    return user;
  } catch (err) {
    logger.error("getUserProfile error: %o", err);
    throw err;
  }
};

// Update profile. Accepts an object with optional nickname, avatarUrl, password
const updateUserProfile = async (userId, { nickname, avatarUrl, password } = {}) => {
  try {
    const updateData = {};

    if (nickname) {
      const nickCheck = checkData(nickname, 5, 15);
      if (!nickCheck.valid) throw new Error(nickCheck.message);

      const existingNickname = await User.findOne({ nickname });
      if (existingNickname && existingNickname._id.toString() !== String(userId)) {
        throw new Error("Nickname already exists.");
      }
      updateData.nickname = nickname;
    }

    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    if (password) {
      const passCheck = checkData(password, 8, 20);
      if (!passCheck.valid) throw new Error(passCheck.message);
      updateData.passwordHash = await hashPassword(password);
    }

    if (Object.keys(updateData).length === 0) {
      logger.info(`No update needed for user: ${userId}`);
      return await User.findById(userId).select("-passwordHash");
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-passwordHash");
    logger.info(`Updated profile for user: ${userId}`);
    return user;
  } catch (err) {
    logger.error("updateUserProfile error: %o", err);
    throw err;
  }
};

// Leaderboard: returns top users for a given gameId ordered by their gameStats.score
const getLeaderboard = async (gameId = "caro") => {
  try {
    const pipeline = [
      { $unwind: "$gameStats" },
      { $match: { "gameStats.gameId": gameId } },
      { $project: { username: 1, nickname: 1, avatarUrl: 1, score: "$gameStats.score" } },
      { $sort: { score: -1 } },
      { $limit: 20 }
    ];

    const users = await User.aggregate(pipeline);
    logger.info(`Fetched leaderboard for gameId: ${gameId}`);
    return users;
  } catch (err) {
    logger.error("getLeaderboard error: %o", err);
    throw err;
  }
};

// Cập nhật gameStats khi game kết thúc
const updateGameStats = async (userId, gameId = "caro", isWin, isDraw = false) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`User not found for stats update: ${userId}`);
      return;
    }

    // Tìm hoặc tạo gameStats cho game này
    let gameStat = user.gameStats.find(s => s.gameId === gameId);
    
    if (!gameStat) {
      // Tạo mới gameStats
      gameStat = {
        gameId: gameId,
        nameGame: "Cờ Caro",
        totalGames: 0,
        totalWin: 0,
        totalLose: 0,
        score: 1000, // Điểm khởi đầu
      };
      user.gameStats.push(gameStat);
    }

    // Cập nhật thống kê
    gameStat.totalGames += 1;
    
    if (isDraw) {
      // Hòa: không thay đổi điểm nhiều
      gameStat.score = Math.max(0, gameStat.score + 0);
    } else if (isWin) {
      gameStat.totalWin += 1;
      // Thắng: +20 điểm
      gameStat.score += 20;
    } else {
      gameStat.totalLose += 1;
      // Thua: -10 điểm
      gameStat.score = Math.max(0, gameStat.score - 10);
    }

    await user.save();
    logger.info(`Updated game stats for user ${userId}: ${isWin ? 'Win' : isDraw ? 'Draw' : 'Lose'}`);
  } catch (err) {
    logger.error("updateGameStats error: %o", err);
    throw err;
  }
};

// Cập nhật trạng thái user (online/offline/in_game)
const updateUserStatus = async (userId, status) => {
  try {
    if (!userId || !status) {
      logger.warn(`Invalid params for updateUserStatus: userId=${userId}, status=${status}`);
      return;
    }

    const validStatuses = ["offline", "online", "in_game", "banned"];
    if (!validStatuses.includes(status)) {
      logger.warn(`Invalid status: ${status}`);
      return;
    }

    const updateData = { status: status };
    // Chỉ cập nhật lastOnline nếu user đang online hoặc in_game
    if (status === "online" || status === "in_game") {
      updateData.lastOnline = new Date();
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      logger.warn(`User not found for status update: ${userId}`);
      return;
    }

    logger.info(`Updated user status: ${userId} -> ${status}`);
    return user;
  } catch (err) {
    logger.error("updateUserStatus error: %o", err);
    // Không throw để không làm gián đoạn flow chính
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getLeaderboard,
  updateGameStats,
  updateUserStatus,
};
