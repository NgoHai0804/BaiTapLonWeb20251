const mongoose = require("mongoose");
const { Schema } = mongoose;

const GameStatSchema = new Schema(
  {
    gameId: { type: String, required: true }, 
    nameGame: { type: String, required: true },
    totalGames: { type: Number, default: 0 }, 
    totalWin: { type: Number, default: 0 }, 
    totalLose: { type: Number, default: 0 }, 
    score: { type: Number, default: 1000 }, // Điểm ELO để xếp hạng
  },
  { _id: false }
);

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true, index: true }, 
  passwordHash: { type: String, required: true }, 
  nickname: { type: String, required: true, unique: true }, 
  email: { type: String, unique: true, sparse: true }, // unique nhưng cho phép null

  avatarUrl: { type: String, default: "default-avatar.png" }, 
  bio: { type: String, maxlength: 200 }, // Giới thiệu bản thân
  
  isVerified: { type: Boolean, default: false }, // Xác thực email
  role: { type: String, enum: ["user", "admin"], default: "user" },

  status: {
    type: String,
    enum: ["offline", "online", "in_game", "banned"],
    default: "offline",
    index: true,
  }, 

  gameStats: { type: [GameStatSchema], default: [] },

  createdAt: { type: Date, default: Date.now }, 
  lastOnline: { type: Date, default: Date.now }, 
});

// Thêm phương thức ảo để lấy tổng tỉ lệ thắng nhanh
UserSchema.virtual('winRate').get(function() {
  if (this.gameStats.length === 0) return 0;
  const total = this.gameStats.reduce((sum, stat) => sum + stat.totalGames, 0);
  const wins = this.gameStats.reduce((sum, stat) => sum + stat.totalWin, 0);
  return total > 0 ? ((wins / total) * 100).toFixed(2) : 0;
});

module.exports = mongoose.model("User", UserSchema);