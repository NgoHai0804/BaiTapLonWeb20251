const mongoose = require("mongoose");
const { Schema } = mongoose;

const GameStatSchema = new Schema(
  {
    gameId: { type: String, required: true }, //Id game
    nameGame: { type: String, required: true },
    totalGames: { type: Number, default: 0 }, // Tổng số ván đã chơi
    totalWin: { type: Number, default: 0 }, // Số ván thắng (thêm theo diagram)
    totalLose: { type: Number, default: 0 }, // Số ván thua (thêm theo diagram)
    score: { type: Number, default: 1000 }, // Điểm cờ caro của người chơi -> Xếp hạng
  },
  { _id: false }
);

const UserSchema = new Schema({
  userId: { type: Number, index: true},
  username: { type: String, required: true, unique: true, index: true }, // Tên đăng nhập
  passwordHash: { type: String, required: true }, // Mật khẩu -> hash
  nickname: { type: String, required: true, unique: true }, // Tên hiển thị
  email: { type: String }, // Email --> cần xác thực --> Lấy lại mật khẩu

  avatarUrl: { type: String }, // Avatar
  status: {
    type: String,
    enum: ["offline", "online", "in_game", "banned"],
    default: "offline",
    index: true,
  }, // Trạng thái hđ --> cập nhật trong socket real-time

  gameStats: { type: [GameStatSchema], default: [] },

  createdAt: { type: Date, default: Date.now }, // Thời gian tạo tài khoản
  lastOnline: { type: Date }, // Thời gian online gần nhất --> cập nhật trong socket real-time
});

UserSchema.index({ username: 1 });
UserSchema.index({ status: 1 });

module.exports = mongoose.model("User", UserSchema);