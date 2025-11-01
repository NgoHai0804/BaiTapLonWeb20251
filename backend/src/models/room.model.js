const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoomPlayerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },  // ID người chơi
  isHost: { type: Boolean, default: false }, // Có phải chủ phòng không (người tạo)
  isReady: { type: Boolean, default: false }, // Người chơi đã bấm “Ready” để bắt đầu chưa
  joinedAt: { type: Date, default: Date.now }, // Thời điểm người chơi tham gia phòng
  sessionId: { type: String } // ID phiên socket hiện tại (để reconnect nhanh nếu rớt mạng)
});

const RoomSchema = new Schema({
  name: { type: String }, // Tên hiển thị của phòng (đổi từ roomName theo diagram)
  passwordHash: { type: String, default: null }, // Mật khẩu phòng 
  hostId: { type: Schema.Types.ObjectId, ref: 'User', index: true }, // ID chủ phòng
  maxPlayers: { type: Number, default: 2 },  // Giới hạn số người chơi trong phòng (2–4)

  status: {type: String, enum: ['waiting','playing','ended'], default: 'waiting', index: true},

  players: { type: [RoomPlayerSchema], default: [] }, // DS người chơi trong phòng
  createdAt: { type: Date, default: Date.now } // Thời gian tạo phòng
});

/**
 * ============================
 *  INDEXES
 * ============================
 * - status: hỗ trợ tìm kiếm phòng đang "waiting" (dành cho matchmaking)
 * - hostId: truy vấn nhanh các phòng người dùng đã tạo
 */
RoomSchema.index({ status: 1 });
RoomSchema.index({ hostId: 1 });

module.exports = mongoose.model('Room', RoomSchema);