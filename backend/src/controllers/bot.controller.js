// bot.controller.js
// Controller cho AI Bot

const response = require("../utils/response");
const aiBotService = require("../services/aiBot.service");
const logger = require("../utils/logger");

// Lấy nước đi tốt nhất của bot
async function getBotMove(req, res) {
  try {
    const { board, botMark, difficulty = 'medium', lastMove } = req.body;

    if (!board || !botMark) {
      return response.error(res, "Board and botMark are required", 400);
    }

    const move = aiBotService.getBestMove(board, botMark, difficulty, lastMove);

    return response.success(res, { move, difficulty }, "Bot move generated");
  } catch (err) {
    logger.error(`getBotMove error: ${err}`);
    return response.error(res, err.message, 500);
  }
}

// --- CODE MỚI THÊM VÀO ĐÂY ---
// Cung cấp gợi ý cho người chơi (Hint)
async function getPlayerHint(req, res) {
  try {
    const { board, playerMark } = req.body;

    if (!board || !playerMark) {
      return response.error(res, "Board and playerMark are required", 400);
    }

    // Sử dụng AI ở mức 'hard' để đưa ra gợi ý tốt nhất cho người chơi
    const hintMove = aiBotService.getBestMove(board, playerMark, 'hard');

    return response.success(res, { hint: hintMove }, "Hint generated successfully");
  } catch (err) {
    logger.error(`getPlayerHint error: ${err}`);
    return response.error(res, err.message, 500);
  }
}
// -----------------------------

module.exports = {
  getBotMove,
  getPlayerHint, // Đừng quên export hàm mới này nhé Hiệp
};