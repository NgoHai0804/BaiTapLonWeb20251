const mongoose = require('mongoose');
const { Schema } = mongoose;

const FriendSchema = new Schema({
  requester: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Yêu cầu
  addressee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Người nhận
  status: { type: String, enum: ['pending','accepted','canceled', 'removed', 'blocked'], default: 'pending' }, // Trạng thái
  createdAt: { type: Date, default: Date.now }, // Ngày tạo
  updateAt: { type: Date, default: Date.now }, // Thời gian cập nhật gần nhất
});

// Middleware để tự động cập nhật updateAt trước khi save
FriendSchema.pre('save', function(next) {
  this.updateAt = Date.now();
  next();
});

FriendSchema.index({ requester: 1, addressee: 1 }, { unique: true });
module.exports = mongoose.model('Friend', FriendSchema);