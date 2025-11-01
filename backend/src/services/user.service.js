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

module.exports = {
  getUserProfile,
  updateUserProfile,
  getLeaderboard,
};
