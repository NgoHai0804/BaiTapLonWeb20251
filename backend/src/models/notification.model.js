const mongoose = require('mongoose');
const { Schema } = mongoose;


const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // User cần thông báo
  type: { type: String, enum: ['friend_request','room_invite','system'], required: true }, // Loại thông báo
  content: { type: String }, // Content
  isRead: { type: Boolean, default: false, index: true }, // Đã đọc?
  createdAt: { type: Date, default: Date.now } // Thời gian
});