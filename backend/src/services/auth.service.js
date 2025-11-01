// auth.service.js
// - Kiểm tra dữ liệu
// - Hash password
// - Tạo user
// - So sánh password
// - Sinh JWT

const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const { signToken } = require("../utils/jwt");
const { checkData, hashPassword } = require("../utils/validation");
const logger = require("../utils/logger");

async function register({ username, password, nickname }) {
  try {
    if (!checkData(username, 5, 15)) 
      return { error: "Username is not valid (5-15 chars)", code: 400 };
    if (!checkData(password, 8, 20)) 
      return { error: "Password is not valid (8-20 chars)", code: 400 };
    if (!checkData(nickname, 5, 15)) 
      return { error: "Nickname is not valid (5-15 chars)", code: 400 };

    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) 
      return { error: "Username already exists", code: 409 };

    const existingUserByNickname = await User.findOne({ nickname });
    if (existingUserByNickname) 
      return { error: "Nickname already exists", code: 409 };

    const passwordHash = await hashPassword(password);
    const user = await User.create({ username, passwordHash, nickname });

    logger.info(`User registered: ${username} (${user._id})`);
    return { data: { id: user._id, username: user.username, nickname: user.nickname } };
  } catch (err) {
    logger.error(`Register failed: ${err.message}`);
    return { error: err.message };
  }
}


async function login({ username, password }) {
  try {
    if (!username || !password) {
      return { error: "Please provide both username and password", code: 400 };
    }

    const user = await User.findOne({ username });
    if (!user) {
      return { error: "Wrong account or password", code: 401 };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return { error: "Wrong account or password", code: 401 };
    }

    const token = signToken(user);
    logger.info(`User logged in: ${username} (${user._id})`);

    return {
      data: {
        token,
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      },
    };
  } catch (err) {
    logger.error(`Login failed for username "${username}": ${err.message}`);
    throw err;
  }
}

module.exports = { register, login, };
