const mongoose = require('mongoose');
const { Schema } = mongoose;

const MoveCaroSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' }, // ID user
  moveNumber: { type: Number, required: true }, // Bước đi số Bao nhiêu
  pieceType: { type: String, enum: ['X', 'O'] }, // Loại quân cờ (thêm theo diagram)
  x: { type: Number, required: true }, // tọa độ
  y: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now } // Thời gian (đổi từ startedAt theo diagram)
}, { _id: false });

const GameCaroSchema = new Schema({
  nameRoom: { type: String },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', index: true }, // ID phòng
  playerX: { type: Schema.Types.ObjectId, ref: 'User' }, // Người chơi X
  playerO: { type: Schema.Types.ObjectId, ref: 'User' }, // Người chơi O
  winnerId: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // Người thắng
  boardSize: { type: Number, default: 15 }, // Size bàn
  startedAt: { type: Date, default: Date.now }, // Thời gian bắt đầu
  endedAt: { type: Date, default: null }, // Thời gian kết thúc
  mode: { type: String, enum: ['P2P','P2B'], default: 'P2P' }, // Loại chơi người vs người, người vs bot
  moves: { type: [MoveCaroSchema], default: [] }, // Danh sách move -> Để người chơi chơi vs bot có thể -> replay

}, { timestamps: false });

GameCaroSchema.index({ roomId: 1, startedAt: -1 });
module.exports = mongoose.model('GameCaro', GameCaroSchema);

// ... (giữ nguyên phần Schema của Hiệp)

// Phương thức tĩnh để lấy lịch sử đấu của một người chơi
GameCaroSchema.statics.getPlayerHistory = function(userId) {
  return this.find({
    $or: [{ playerX: userId }, { playerO: userId }]
  })
  .sort({ startedAt: -1 }) // Trận mới nhất lên đầu
  .populate('playerX playerO winnerId', 'username nickname avatar'); // Lấy thêm thông tin user
};

// Phương thức để tính tỉ lệ thắng (ví dụ cho dashboard)
GameCaroSchema.statics.getWinLossStats = async function(userId) {
  const games = await this.find({
    $or: [{ playerX: userId }, { playerO: userId }],
    winnerId: { $ne: null }
  });

  const wins = games.filter(g => g.winnerId.toString() === userId.toString()).length;
  return {
    totalGames: games.length,
    wins: wins,
    winRate: games.length > 0 ? (wins / games.length * 100).toFixed(2) + '%' : '0%'
  };
};

GameCaroSchema.index({ roomId: 1, startedAt: -1 });
module.exports = mongoose.model('GameCaro', GameCaroSchema);