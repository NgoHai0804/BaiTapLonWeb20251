// friend.controller.js
// Quản lý quan hệ bạn bè giữa người chơi.

const friendService = require("../services/friend.service");
const response = require("../utils/response");

// ============================================
// Lấy danh sách bạn bè
// ============================================
async function getFriends(req, res) {
  try {
    const userId = req.user._id;
    const friends = await friendService.getFriendsList(userId);
    return response.success(res, friends, "Lấy danh sách bạn bè thành công");
  } catch (err) {
    console.error("getFriends error:", err);
    return response.error(res, err.message);
  }
}

// ============================================
// Gửi lời mời kết bạn (Đã thêm check trùng ID)
// ============================================
async function sendRequest(req, res) {
  try {
    const { addresseeId } = req.body;
    const requesterId = req.user._id;

    if (!addresseeId) return response.error(res, "Thiếu addresseeId", 400);
    
    // Ngăn chặn tự gửi kết bạn cho chính mình
    if (requesterId.toString() === addresseeId.toString()) {
      return response.error(res, "Bạn không thể gửi lời mời kết bạn cho chính mình", 400);
    }

    const request = await friendService.sendFriendRequest(requesterId, addresseeId);
    return response.success(res, request, "Đã gửi lời mời kết bạn");
  } catch (err) {
    console.error("sendRequest error:", err);
    return response.error(res, err.message);
  }
}

// ============================================
// Lấy danh sách lời mời
// ============================================
async function getRequests(req, res) {
  try {
    const userId = req.user._id;
    const requests = await friendService.getPendingRequests(userId);
    return response.success(res, requests, "Lấy danh sách lời mời thành công");
  } catch (err) {
    console.error("getRequests error:", err);
    return response.error(res, err.message);
  }
}

// ============================================
// Chấp nhận lời mời kết bạn
// ============================================
async function acceptRequest(req, res) {
  try {
    const userId = req.user._id;
    const { requesterId } = req.body;

    if (!requesterId) return response.error(res, "Thiếu requesterId", 400);

    const result = await friendService.acceptFriendRequest(requesterId, userId);
    return response.success(res, result, "Đã chấp nhận lời mời");
  } catch (err) {
    console.error("acceptRequest error:", err);
    return response.error(res, err.message);
  }
}

// ============================================
// Hủy lời mời hoặc từ chối
// ============================================
async function cancelRequest(req, res) {
  try {
    const userId = req.user._id;
    const { requesterId } = req.body;

    if (!requesterId) return response.error(res, "Thiếu requesterId", 400);

    await friendService.cancelFriendRequest(requesterId, userId);
    return response.success(res, {}, "Đã hủy yêu cầu kết bạn");
  } catch (err) {
    console.error("cancelRequest error:", err);
    return response.error(res, err.message);
  }
}

// ============================================
// Tìm bạn bè theo nickname
// ============================================
async function searchUser(req, res) {
  try {
    const { nickname, userID } = req.body; 
    const excludeUserId = req.user._id;

    if (!nickname && !userID) {
      return response.error(res, "Vui lòng nhập nickname hoặc userID để tìm kiếm", 400);
    }

    const searchNickname = nickname ? nickname.trim() : null;
    const users = await friendService.searchUsers(searchNickname, userID, excludeUserId);
    
    return response.success(res, users, users.length > 0 ? "Tìm thấy người dùng" : "Không tìm thấy ai");
  } catch (err) {
    console.error("searchUser error:", err);
    return response.error(res, err.message);
  }
}

// ============================================
// Hủy kết bạn
// ============================================
async function removeFriend(req, res) {
  try {
    const userId = req.user._id;
    const { friendId } = req.body;

    if (!friendId) return response.error(res, "Thiếu friendId", 400);

    await friendService.removeFriend(userId, friendId);
    return response.success(res, {}, "Đã hủy kết bạn");
  } catch (err) {
    console.error("removeFriend error:", err);
    return response.error(res, err.message);
  }
}

module.exports = {
  getFriends,
  sendRequest,
  getRequests,
  acceptRequest,
  cancelRequest,
  searchUser,
  removeFriend,
};