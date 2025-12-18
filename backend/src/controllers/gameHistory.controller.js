const gameHistoryService = require('../services/gameHistory.service');
const response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Lấy lịch sử game của user
 * GET /api/history/:userId
 */
async function getUserHistory(req, res) {
    try {
        const { userId } = req.params;
        const { limit = 20, skip = 0 } = req.query;

        const history = await gameHistoryService.getUserGameHistory(
            userId,
            parseInt(limit),
            parseInt(skip)
        );

        return response.success(res, history, 'Get game history success');
    } catch (error) {
        logger.error(`getUserHistory error: ${error.message}`);
        return response.error(res, error.message, 500);
    }
}

/**
 * Lấy chi tiết game để replay
 * GET /api/history/detail/:gameId
 */
async function getGameDetail(req, res) {
    try {
        const { gameId } = req.params;

        const game = await gameHistoryService.getGameDetail(gameId);

        return response.success(res, game, 'Get game detail success');
    } catch (error) {
        logger.error(`getGameDetail error: ${error.message}`);
        return response.error(res, error.message, 404);
    }
}

/**
 * Lấy thống kê game của user
 * GET /api/history/stats/:userId
 */
async function getUserStats(req, res) {
    try {
        const { userId } = req.params;

        const stats = await gameHistoryService.getUserStats(userId);

        return response.success(res, stats, 'Get user stats success');
    } catch (error) {
        logger.error(`getUserStats error: ${error.message}`);
        return response.error(res, error.message, 500);
    }
}

/**
 * Lưu kết quả game (được gọi từ socket hoặc API)
 * POST /api/history/save
 */
async function saveGameResult(req, res) {
    try {
        const gameData = req.body;

        const savedGame = await gameHistoryService.saveGameHistory(gameData);

        return response.success(res, savedGame, 'Game result saved successfully');
    } catch (error) {
        logger.error(`saveGameResult error: ${error.message}`);
        return response.error(res, error.message, 500);
    }
}

module.exports = {
    getUserHistory,
    getGameDetail,
    getUserStats,
    saveGameResult
};
