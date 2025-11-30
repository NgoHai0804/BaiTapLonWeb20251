// chat.service.js
// Nghiệp vụ nhắn tin và lưu trữ hội thoại.
const Message = require("../models/message.model");
const logger = require("../utils/logger");

// Lưu tin nhắn vào DB
async function saveMessage({ roomId, senderId, receiverId, type = 'text', message }) {
  try {
    const newMessage = await Message.create({
      roomId: roomId || null,
      senderId,
      receiverId: receiverId || null,
      type,
      message,
      isRead: false,
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'username nickname avatarUrl')
      .populate('receiverId', 'username nickname avatarUrl');

    logger.info(`Message saved: ${newMessage._id}`);
    return populatedMessage;
  } catch (err) {
    logger.error("saveMessage error: %o", err);
    throw err;
  }
}

// Lấy lịch sử chat của phòng
async function getRoomMessages(roomId, limit = 50) {
  try {
    const messages = await Message.find({ roomId })
      .populate('senderId', 'username nickname avatarUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Đảo ngược để hiển thị từ cũ đến mới
    return messages.reverse();
  } catch (err) {
    logger.error("getRoomMessages error: %o", err);
    throw err;
  }
}

// Lấy lịch sử chat riêng giữa 2 người
async function getPrivateMessages(userId1, userId2, limit = 50) {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
      roomId: null,
    })
      .populate('senderId', 'username nickname avatarUrl')
      .populate('receiverId', 'username nickname avatarUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return messages.reverse();
  } catch (err) {
    logger.error("getPrivateMessages error: %o", err);
    throw err;
  }
}

// Đánh dấu tin nhắn đã đọc
async function markMessageAsRead(messageId, userId) {
  try {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Message not found");

    // Chỉ đánh dấu đọc nếu người đọc là người nhận
    if (message.receiverId && message.receiverId.toString() === userId.toString()) {
      message.isRead = true;
      await message.save();
    }

    return message;
  } catch (err) {
    logger.error("markMessageAsRead error: %o", err);
    throw err;
  }
}

// Đánh dấu tất cả tin nhắn trong phòng đã đọc
async function markRoomMessagesAsRead(roomId, userId) {
  try {
    await Message.updateMany(
      { roomId, receiverId: userId, isRead: false },
      { isRead: true }
    );
    return true;
  } catch (err) {
    logger.error("markRoomMessagesAsRead error: %o", err);
    throw err;
  }
}

module.exports = {
  saveMessage,
  getRoomMessages,
  getPrivateMessages,
  markMessageAsRead,
  markRoomMessagesAsRead,
};
