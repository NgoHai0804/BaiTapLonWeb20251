// friend.service.js
// Xử lý quan hệ bạn bè và lời mời kết bạn.
const Friend = require("../models/friend.model");
const User = require("../models/user.model");
const logger = require("../utils/logger");

const mongoose = require('mongoose');

// Nếu có socket.io instance
let io = null;

function setSocketInstance(socketInstance) {
  io = socketInstance;
}



// ------------------------
// CÁC HÀM NGHIỆP VỤ CHÍNH
// ------------------------


// 1 Gửi lời mời kết bạn
async function sendFriendRequest(requesterId, addresseeId) {
  try {
    if (requesterId === addresseeId)
      throw new Error("Không thể gửi lời mời cho chính mình");
    const addressee = await User.findById(addresseeId);
    if (!addressee) throw new Error("User nhận không tồn tại");
    const existing = await Friend.findOne({
      $or: [
        { requester: requesterId, addressee: addresseeId },
        { requester: addresseeId, addressee: requesterId },
      ],
    });
    if (existing) {
      if (existing.status === "pending") {
        throw new Error("Đã tồn tại lời mời kết bạn đang chờ xử lý");
      }
      if (existing.status === "accepted") {
        throw new Error("Hai người đã là bạn bè");
      }
      if (existing.status === "canceled" || existing.status === "removed") {
        // Gửi lại: cập nhật thành pending mới
        existing.status = "pending";
        existing.updateAt = Date.now();
        await existing.save();
        logger.info(`User ${requesterId} resent friend request to ${addresseeId}`);
        if (io)
          io.to(addresseeId.toString()).emit("friend:requestReceived", existing);
        return existing;
      }
    }
    const newRequest = await Friend.create({
      requester: requesterId,
      addressee: addresseeId,
    });
    logger.info(`User ${requesterId} sent friend request to ${addresseeId}`);
    if (io)
      io.to(addresseeId.toString()).emit("friend:requestReceived", newRequest);
    return newRequest;
  } catch (err) {
    if (err.code === 11000) {
      throw new Error("Đã tồn tại mối quan hệ hoặc lời mời");
    }
    logger.error("sendFriendRequest error: %o", err);
    throw err;
  }
}


// 2️ Chấp nhận lời mời
async function acceptFriendRequest(userAId, userBId) {
  try {
    console.log("acceptFriendRequest:", userAId, userBId);
    // Tìm xem giữa 2 user có lời mời pending nào không
    const request = await Friend.findOne({
      $or: [
        { requester: userAId, addressee: userBId, status: "pending" },
        { requester: userBId, addressee: userAId, status: "pending" },
      ],
    });
    // Nếu không có lời mời thì báo lỗi
    if (!request) throw new Error("Không tìm thấy lời mời kết bạn");


    // Cập nhật trạng thái thành accepted
    request.status = "accepted";

    await request.save();
    logger.info(`Friend request accepted between ${userAId} and ${userBId}`);

    // Gửi realtime (nếu có socket.io)
    if (typeof io !== "undefined" && io) {
      io.to(userAId.toString()).emit("friend:accepted", userBId);
      io.to(userBId.toString()).emit("friend:accepted", userAId);
    }
    return request;
  } catch (err) {
    logger.error("acceptFriendRequest error: %o", err);
    throw err;
  }
}


// 3️ Hủy lời mời hoặc từ chối
async function cancelFriendRequest(userAId, userBId) {
  try {
    console.log("cancelFriendRequest:", userAId, userBId);
    const request = await Friend.findOne({
      $or: [
        { requester: userAId, addressee: userBId, status: "pending" },
        { requester: userBId, addressee: userAId, status: "pending" },
      ],
    });
    if (!request) throw new Error("Không tìm thấy lời mời để hủy");

    request.status = "canceled";
    await request.save();

    logger.info(`User ${userAId} canceled/declined friend request with ${userBId}`);

    return request;
  } catch (err) {
    logger.error("cancelFriendRequest error: %o", err);
    throw err;
  }
}

// 4️ Xóa bạn (unfriend)
async function removeFriend(userAId, userBId) {
  try {
    const friendRecord = await Friend.findOne({
      $or: [
        { requester: userAId, addressee: userBId, status: "accepted" },
        { requester: userBId, addressee: userAId, status: "accepted" },
      ],
    });
    if (!friendRecord) throw new Error("Không có mối quan hệ để xóa");
    friendRecord.status = "removed";
    await friendRecord.save();
    logger.info(`User ${userAId} removed friend ${userBId}`);
    if (io) io.to(userBId.toString()).emit("friend:removed", userAId);
    return true;
  } catch (err) {
    logger.error("removeFriend error: %o", err);
    throw err;
  }
}


// 5️ Lấy danh sách bạn bè
async function getFriendsList(userId) {
  try {
    const friends = await Friend.find({
      $or: [
        { requester: userId, status: "accepted" },
        { addressee: userId, status: "accepted" },
      ],
    })
      .populate("requester", "username nickname avatarUrl status")
      .populate("addressee", "username nickname avatarUrl status");
    const result = friends.map((f) =>
      f.requester._id.toString() === userId.toString()
        ? f.addressee
        : f.requester
    );
    logger.info(`Fetched friends list for user ${userId}`);
    return result;
  } catch (err) {
    logger.error("getFriendsList error: %o", err);
    throw err;
  }
}

// 6️ Lấy danh sách lời mời chờ
async function getPendingRequests(userId) {
  try {
    const requests = await Friend.find({
      addressee: userId,
      status: "pending",
    }).populate("requester", "username nickname avatarUrl");
    logger.info(`Fetched pending friend requests for user ${userId}`);
    return requests;
  } catch (err) {
    logger.error("getPendingRequests error: %o", err);
    throw err;
  }
}

// 7️ Kiểm tra quan hệ giữa 2 người
async function getRelationshipStatus(userAId, userBId) {
  try {
    const rel = await Friend.findOne({
      $or: [
        { requester: userAId, addressee: userBId },
        { requester: userBId, addressee: userAId },
      ],
    });
    return rel ? rel.status : "none";
  } catch (err) {
    logger.error("getRelationshipStatus error: %o", err);
    throw err;
  }
}

// 8 Tìm người dùng theo nickname HOẶC userID (loại trừ bản thân) - Ưu tiên userID
async function searchUsers(nickname, userID, excludeUserId) {
  try {
    if (!excludeUserId) {
      logger.warn("Thiếu excludeUserId, trả về empty array");
      return [];
    }

    let query = { _id: { $ne: excludeUserId } };

    // Ưu tiên userID nếu có (tìm chính xác 1 user)
    if (userID) {
      console.log("Input userID:", userID, typeof userID, userID.length); // Debug log
      // Trim để loại bỏ space thừa nếu có
      const trimmedUserID = userID.trim();
      try {
        const userIdObj = new mongoose.Types.ObjectId(trimmedUserID);
        // Nếu tìm userID chính là excludeUserId, return empty
        if (userIdObj.toString() === excludeUserId.toString()) {
          console.log("Searching self, return empty");
          return [];
        }
        query._id = userIdObj; // Tìm chính xác userID
        console.log("Searching by userID:", userIdObj);
      } catch (err) {
        console.error("ObjectId creation error:", err); // Debug log
        throw new Error("userID không hợp lệ");
      }
    } else if (nickname && nickname.length > 0) {
      // Chỉ tìm theo nickname nếu KHÔNG có userID
      query.nickname = { $regex: nickname, $options: "i" };
      console.log("Searching by nickname:", nickname);
    } else {
      // Không có tham số tìm kiếm hợp lệ nào
      console.log("No valid search params provided");
      return [];
    }

    const users = await User.find(query).select("username nickname avatarUrl status");
    console.log("Found users:", users.length, users);

    // Lấy friendStatus cho từng user (nếu users không empty)
    let usersWithFriendStatus = [];
    if (users.length > 0) {
      usersWithFriendStatus = await Promise.all(
        users.map(async (user) => {
          const friendStatus = await getRelationshipStatus(excludeUserId, user._id);
          return {
            ...user.toObject(),
            friendStatus,
          };
        })
      );
    }
    console.log(usersWithFriendStatus);

    const searchType = userID ? 'userID' : 'nickname';
    logger.info(`Search users by ${searchType} - Found: ${usersWithFriendStatus.length}`);
    return usersWithFriendStatus;
  } catch (err) {
    logger.error("searchUsers error: %o", err);
    throw err;
  }
}

// ------------------------
// Export ra cho controller gọi
// ------------------------
module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriendsList,
  getPendingRequests,
  getRelationshipStatus,
  searchUsers,
};
