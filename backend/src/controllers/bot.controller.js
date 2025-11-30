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

module.exports = {
  getBotMove,
};

