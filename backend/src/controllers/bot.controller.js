// bot.controller.js
// Controller xử lý request liên quan đến AI Bot (tính nước đi cho bot)
const response = require("../utils/response");
const aiBotService = require("../services/aiBot.service");
const logger = require("../utils/logger");

// Tinh tong va tra ve nuoc di tot nhat cho bot dua tren ban co hien tai va do kho
function calculateTotalScore(board, botMark, difficulty) {
  // Implementation here
}

// Tinh tong va tra ve nuoc di tot nhat cho bot dua tren ban co hien tai va do kho
function getBestMove(board, botMark, difficulty, lastMove) {
  // Implementation here
}   
 


// Tính toán và trả về nước đi tốt nhất cho bot dựa trên bàn cờ hiện tại và độ khó
async function getBotMove(req, res) {
  try {
    const { board, botMark, difficulty = 'medium', lastMove } = req.body;

    if (!board || !botMark) {
      return response.error(res, "Board and botMark are required", 400);
    }

    const move = aiBotService.getBestMove(board, botMark, difficulty, lastMove);

    return response.success(res, { move, difficulty }, "Bot move generated");
  } catch (err) {
    logger.error(`Lỗi khi tính nước đi bot: ${err}`);
    return response.error(res, err.message, 500);
  }
}

module.exports = {
  getBotMove,
};

