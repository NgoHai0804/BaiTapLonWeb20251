// friend.controller.js
// Quản lý quan hệ bạn bè giữa người chơi.

// Chức năng:
// 1. Lấy danh sách bạn bè  RESTful
// 2. Gửi lời mời kết bạn RESTful
// 3. Lấy danh sách lời mời RESTful
// 4. Chấp nhận/ Hủy lời mời RESTful
// 5. Tìm bạn bè theo username RESTful
// 6. Hủy kết bạn RESTful


const friendService = require("../services/friend.service");
console.log(friendService);
const response = require("../utils/response");

// ============================================
// Lấy danh sách bạn bè
// ============================================
async function getFriends(req, res) {
  try {
    const userId = req.user._id;
    const friends = await friendService.getFriendsList(userId);
    return response.success(res, friends, "Get friends list success");
  } catch (err) {
    console.error("getFriends error:", err);
    return response.error(res, err.message);
  }
}

// ============================================
// Gửi lời mời kết bạn
// ============================================
async function sendRequest(req, res) {
  try {
    if (!req.user || !req.user._id) {
      return response.error(res, "Bạn chưa đăng nhập hoặc token không hợp lệ");
    }

    const { addresseeId } = req.body;
    if (!addresseeId) {
      return response.error(res, "Thiếu addresseeId trong body");
    }

    const requesterId = req.user._id;
    const request = await friendService.sendFriendRequest(requesterId, addresseeId);
    return response.success(res, request, "Friend request sent");
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
    return response.success(res, requests, "Get pending requests success");
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

    const result = await friendService.acceptFriendRequest(requesterId, userId);
    return response.success(res, result, "Friend request accepted");
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
    if (!userId) return response.error(res, "userId not founded", 400);
    const { requesterId } = req.body;

    await friendService.cancelFriendRequest(requesterId, userId);
    return response.success(res, {}, "Friend request canceled");
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
    const { nickname, userID } = req.body; // Hoặc req.query nếu từ GET
    const excludeUserId = req.user._id;
    if ((!nickname || nickname.trim() === '') && (!userID)) {
      return response.error(res, "Thiếu tham số tìm kiếm (nickname hoặc userID)", 400);
    }
    // Tránh lỗi trim() nếu nickname undefined/null
    const searchNickname = nickname ? nickname.trim() : null;
    const users = await friendService.searchUsers(searchNickname, userID, excludeUserId);
    console.log(users);
    if (users.length === 0) {
      return response.success(res, [], "Không tìm thấy User phù hợp"); // Trả success với empty để linh hoạt
    }
    return response.success(res, users, "Tìm kiếm thành công");
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

    await friendService.removeFriend(userId, friendId);
    return response.success(res, {}, "Friend removed");
  } catch (err) {
    console.error("removeFriend error:", err);
    return response.error(res, err.message);
  }
}

// ============================================
// Chặn bạn bè
// ============================================
async function blockFriend(req, res) {
  try {
    const userId = req.user._id;
    const { friendId } = req.body;

    await friendService.blockFriend(userId, friendId);
    return response.success(res, {}, "Friend blocked");
  } catch (err) {
    console.error("blockFriend error:", err);
    return response.error(res, err.message);
  }
}

// ============================================
// Bỏ chặn bạn bè
// ============================================
async function unblockFriend(req, res) {
  try {
    const userId = req.user._id;
    const { friendId } = req.body;

    await friendService.unblockFriend(userId, friendId);
    return response.success(res, {}, "Friend unblocked");
  } catch (err) {
    console.error("unblockFriend error:", err);
    return response.error(res, err.message);
  }
}

// ============================================
// Export toàn bộ controller
// ============================================
module.exports = {
  getFriends,
  sendRequest,
  getRequests,
  acceptRequest,
  cancelRequest,
  searchUser,
  removeFriend,
  blockFriend,
  unblockFriend,
};
