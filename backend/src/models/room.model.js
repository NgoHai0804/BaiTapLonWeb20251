const mongoose = require("mongoose");
const { Schema } = mongoose;

const RoomPlayerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String },
  isHost: { type: Boolean, default: false },
  isReady: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
  sessionId: { type: String }, 
  isDisconnected: { type: Boolean, default: false },
  disconnectedAt: { type: Date },
}, { _id: false }); // Không cần ID riêng cho từng player trong mảng

const RoomSchema = new Schema({
  name: { type: String, required: true }, 
  passwordHash: { type: String, default: null }, 
  
  // Thuộc tính ảo để check nhanh phòng có mật khẩu không
  isPrivate: { type: Boolean, default: false },

  hostId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  maxPlayers: { type: Number, default: 2 },

  status: {
    type: String,
    enum: ["waiting", "playing", "ended"],
    default: "waiting",
    index: true,
  },

  // Lưu ID của trận đấu đang diễn ra
  currentGameId: { type: Schema.Types.ObjectId, ref: "GameCaro", default: null },

  players: { type: [RoomPlayerSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

// Index giúp tìm các phòng đang "waiting" nhanh nhất để hiển thị danh sách
RoomSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Room", RoomSchema);