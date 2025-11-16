// models/index.js
// Tập hợp tất cả các Model để export tập trung

const User = require('./user.model');
const Friend = require('./friend.model');
const Room = require('./room.model');
const GameCaro = require('./gameCaro.model');
const Message = require('./message.model');
const Notification = require('./notification.model');

// Bạn có thể thêm các logic kiểm tra kết nối DB tại đây nếu cần

const db = {
  User,
  Friend,
  Room,
  GameCaro,
  Message,
  Notification
};

module.exports = db;