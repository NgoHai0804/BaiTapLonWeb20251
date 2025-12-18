const GameHistory = require('../models/gameHistory.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Lưu kết quả game vào database
 * @param {Object} gameData - Dữ liệu game (roomId, players, moves, winner, etc.)
 * @returns {Promise<Object>} Game history đã lưu
 */
async function saveGameHistory(gameData) {
    try {
        const { roomId, players, moves, winner, winnerUserId, boardSize, gameMode, duration } = gameData;

        const gameHistory = new GameHistory({
            roomId,
            players,
            moves,
            winner,
            winnerUserId,
            boardSize: boardSize || 15,
            gameMode: gameMode || 'online',
            duration: duration || 0
        });

        await gameHistory.save();

        // Cập nhật thống kê cho từng player
        for (const player of players) {
            await updatePlayerStats(player.userId, player.isWinner, gameMode);
        }

        logger.info(`Game history saved: ${gameHistory._id}`);
        return gameHistory;
    } catch (error) {
        logger.error(`saveGameHistory error: ${error.message}`);
        throw error;
    }
}

/**
 * Cập nhật thống kê game cho user
 */
async function updatePlayerStats(userId, isWinner, gameMode = 'caro') {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        // Tìm hoặc tạo game stats
        let gameStatIndex = user.gameStats.findIndex(g => g.gameId === gameMode);

        if (gameStatIndex === -1) {
            user.gameStats.push({
                gameId: gameMode,
                nameGame: 'Caro Online',
                totalGames: 0,
                totalWin: 0,
                totalLose: 0,
                score: 1000
            });
            gameStatIndex = user.gameStats.length - 1;
        }

        // Cập nhật stats
        user.gameStats[gameStatIndex].totalGames += 1;

        if (isWinner) {
            user.gameStats[gameStatIndex].totalWin += 1;
            user.gameStats[gameStatIndex].score += 20; // +20 điểm khi thắng
        } else {
            user.gameStats[gameStatIndex].totalLose += 1;
            user.gameStats[gameStatIndex].score = Math.max(0, user.gameStats[gameStatIndex].score - 10); // -10 khi thua
        }

        await user.save();
    } catch (error) {
        logger.error(`updatePlayerStats error: ${error.message}`);
    }
}

/**
 * Lấy lịch sử game của user
 * @param {String} userId - ID của user
 * @param {Number} limit - Số lượng game lấy ra (mặc định 20)
 * @param {Number} skip - Bỏ qua bao nhiêu game (cho phân trang)
 * @returns {Promise<Array>} Danh sách game history
 */
async function getUserGameHistory(userId, limit = 20, skip = 0) {
    try {
        const gameHistories = await GameHistory.find({
            'players.userId': userId
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .populate('players.userId', 'username nickname avatarUrl')
            .populate('winnerUserId', 'username nickname avatarUrl')
            .lean();

        return gameHistories;
    } catch (error) {
        logger.error(`getUserGameHistory error: ${error.message}`);
        throw error;
    }
}

/**
 * Lấy chi tiết 1 game để replay
 * @param {String} gameId - ID của game
 * @returns {Promise<Object>} Chi tiết game
 */
async function getGameDetail(gameId) {
    try {
        const game = await GameHistory.findById(gameId)
            .populate('players.userId', 'username nickname avatarUrl')
            .populate('winnerUserId', 'username nickname avatarUrl')
            .lean();

        if (!game) {
            throw new Error('Game not found');
        }

        return game;
    } catch (error) {
        logger.error(`getGameDetail error: ${error.message}`);
        throw error;
    }
}

/**
 * Lấy thống kê game của user
 * @param {String} userId - ID của user
 * @returns {Promise<Object>} Thống kê
 */
async function getUserStats(userId) {
    try {
        const totalGames = await GameHistory.countDocuments({
            'players.userId': userId
        });

        const wins = await GameHistory.countDocuments({
            'players.userId': userId,
            'players.isWinner': true
        });

        const recentGames = await getUserGameHistory(userId, 10, 0);

        return {
            totalGames,
            wins,
            losses: totalGames - wins,
            winRate: totalGames > 0 ? ((wins / totalGames) * 100).toFixed(2) : 0,
            recentGames
        };
    } catch (error) {
        logger.error(`getUserStats error: ${error.message}`);
        throw error;
    }
}

module.exports = {
    saveGameHistory,
    getUserGameHistory,
    getGameDetail,
    getUserStats,
    updatePlayerStats
};
