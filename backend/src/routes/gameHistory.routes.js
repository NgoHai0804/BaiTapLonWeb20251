const express = require('express');
const router = express.Router();
const gameHistoryController = require('../controllers/gameHistory.controller');
const verifyToken = require('../middlewares/auth.middleware');

// Lấy lịch sử game của user
router.get('/:userId', verifyToken, gameHistoryController.getUserHistory);

// Lấy chi tiết game để replay
router.get('/detail/:gameId', verifyToken, gameHistoryController.getGameDetail);

// Lấy thống kê game của user
router.get('/stats/:userId', verifyToken, gameHistoryController.getUserStats);

// Lưu kết quả game (có thể gọi từ socket hoặc API)
router.post('/save', verifyToken, gameHistoryController.saveGameResult);

module.exports = router;
