const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema({
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', default: null, index: true }, // null => private msg
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Người gửi
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true }, // nếu private

  type: { type: String, enum: ['text','emoji','sticker'], default: 'text' }, // Loại tin nhắn
  message: { type: String }, // Tin nhắn
  isRead: { type: Boolean, default: false }, // Trạng thái đã đọc (thêm theo diagram)

  createdAt: { type: Date, default: Date.now, index: true } // Thời gian
});
// index composite for room chat ordering
MessageSchema.index({ roomId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);