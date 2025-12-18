import api from './axios';

/**
 * Friend API Services
 */

// Lấy danh sách bạn bè
export const getFriendsList = () => {
    return api.get('/friend');
};

// Lấy danh sách lời mời kết bạn
export const getFriendRequests = () => {
    return api.get('/friend/requests');
};

// Gửi yêu cầu kết bạn
export const sendFriendRequest = (addresseeId) => {
    return api.post('/friend/request', { addresseeId });
};

// Chấp nhận lời mời kết bạn
export const acceptFriendRequest = (requesterId) => {
    return api.post('/friend/accept', { requesterId });
};

// Từ chối/hủy lời mời kết bạn
export const cancelFriendRequest = (requesterId) => {
    return api.post('/friend/cancel', { requesterId });
};

// Hủy kết bạn
export const unfriend = (friendId) => {
    return api.post('/friend/unfriend', { friendId });
};

// Tìm kiếm người dùng
export const searchUsers = (searchData) => {
    return api.post('/friend/search', searchData);
};

export default {
    getFriendsList,
    getFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    cancelFriendRequest,
    unfriend,
    searchUsers
};