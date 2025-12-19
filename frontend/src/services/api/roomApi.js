import api from './axios';

/**
 * Room API Services
 * Quản lý các phòng chơi (rooms)
 */

// Lấy danh sách phòng
export const getRooms = (params = {}) => {
    return api.get('/room', { params });
};

// Lấy chi tiết phòng
export const getRoomDetail = (roomId) => {
    return api.get(`/room/${roomId}`);
};

// Tạo phòng mới
export const createRoom = (roomData) => {
    return api.post('/room', roomData);
};

// Tham gia phòng
export const joinRoom = (roomId, password = null) => {
    return api.post(`/room/${roomId}/join`, { password });
};

// Thoát phòng
export const leaveRoom = (roomId) => {
    return api.post(`/room/${roomId}/leave`);
};

// Bắt đầu game
export const startGame = (roomId) => {
    return api.post(`/room/${roomId}/start`);
};

// Xóa phòng (chủ phòng)
export const deleteRoom = (roomId) => {
    return api.delete(`/room/${roomId}`);
};

export default {
    getRooms,
    getRoomDetail,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    deleteRoom
};