import api from './axios';

/**
 * User API Services
 */

// Lấy thông tin profile người dùng
export const getUserProfile = () => {
    return api.get('/user/profile');
};

// Cập nhật profile { username, avatar, bio }
export const updateUserProfile = (profileData) => {
    return api.put('/user/update-profile', profileData);
};

// Lấy leaderboard
export const getLeaderboard = (gameId = 'caro') => {
    return api.get('/user/leaderboard', { params: { gameId } });
};

// Lấy lịch sử game của user
export const getUserGameHistory = (userId, limit = 20, skip = 0) => {
    return api.get(`/history/${userId}`, { params: { limit, skip } });
};

// Lấy chi tiết game để replay
export const getGameDetail = (gameId) => {
    return api.get(`/history/detail/${gameId}`);
};

// Lấy thống kê game
export const getUserStats = (userId) => {
    return api.get(`/history/stats/${userId}`);
};

export default {
    getUserProfile,
    updateUserProfile,
    getLeaderboard,
    getUserGameHistory,
    getGameDetail,
    getUserStats
};