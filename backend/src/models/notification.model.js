const mongoose = require("mongoose");
const { Schema } = mongoose;

const NotificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  }, // Người nhận thông báo

  senderId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null
  }, // Người gửi (ví dụ: người gửi lời mời kết bạn)

  type: {
    type: String,
    enum: ["friend_request", "room_invite", "system", "game_result"],
    required: true,
  }, // Loại thông báo

  content: { type: String, required: true }, // Nội dung hiển thị

  // Metadata: Lưu các thông tin bổ sung tùy theo loại thông báo
  // Ví dụ: { roomId: "...", friendRequestId: "..." }
  metadata: {
    type: Object,
    default: {}
  },

  isRead: { type: Boolean, default: false, index: true }, 
  createdAt: { type: Date, default: Date.now },
});

// Thêm index để truy vấn nhanh danh sách thông báo chưa đọc của 1 user
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);