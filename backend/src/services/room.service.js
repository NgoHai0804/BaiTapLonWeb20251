// room.service.js
// Xử lý logic phòng chơi Caro.
const Room = require("../models/room.model");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
// Helper: convert Mongoose doc sang JSON
function toJSON(room) {
  return room.toObject({ getters: true });
}
// Tạo phòng mới
async function createRoom({ name, password, maxPlayers, hostId, hostUsername }) {
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const room = await Room.create({
    name: name || `Phòng #${Math.floor(Math.random() * 10000)}`,
    passwordHash,
    hostId,
    maxPlayers,
    players: [
      {
        userId: hostId,
        username: hostUsername,
        isHost: true,
        isReady: false,
        sessionId: uuidv4(),
        isDisconnected: false,
      },
    ],
    status: "waiting",
  });
  return toJSON(room);
}
// Tham gia phòng
async function joinRoom({ roomId, password, userId, username }) {
  const room = await Room.findById(roomId);
  if (!room) throw new Error("Phòng không tồn tại");
  // Cho phép join lại nếu phòng đang playing (reconnect)
  if (room.status === "ended") throw new Error("Phòng đã kết thúc");
  
  // Kiểm tra xem user đã ở trong phòng chưa
  const existingPlayer = room.players.find((p) => p.userId.toString() === userId.toString());
  if (existingPlayer) {
    // User đã ở trong phòng (có thể do reconnect)
    // Nếu đang disconnected, đánh dấu là reconnected
    if (existingPlayer.isDisconnected) {
      existingPlayer.isDisconnected = false;
      existingPlayer.disconnectedAt = null;
      existingPlayer.sessionId = require("uuid").v4();
      await room.save();
    }
    // Chỉ kiểm tra password nếu là join mới (không phải reconnect)
    if (!existingPlayer.isDisconnected && room.passwordHash && !(await bcrypt.compare(password || "", room.passwordHash))) {
      throw new Error("Sai mật khẩu");
    }
    return toJSON(room);
  }
  
  // Join mới - kiểm tra xem user có đang ở phòng khác không
  const otherRoom = await findRoomByUserId(userId);
  if (otherRoom && otherRoom._id.toString() !== roomId.toString()) {
    // User đang ở phòng khác, tự động rời phòng cũ
    await leaveAllOtherRooms(userId, roomId);
  }

  // Join mới - kiểm tra password
  if (room.passwordHash && !(await bcrypt.compare(password || "", room.passwordHash))) {
    throw new Error("Sai mật khẩu");
  }
  
  if (room.players.length >= room.maxPlayers) throw new Error("Phòng đã đầy");
  const newPlayer = {
    userId,
    username,
    isHost: false,
    isReady: false,
    sessionId: uuidv4(),
    isDisconnected: false,
  };
  room.players.push(newPlayer);
  await room.save();
  return toJSON(room);
}
// Rời phòng
async function leaveRoom({ roomId, userId }) {
  const room = await Room.findById(roomId);
  if (!room) throw new Error("Phòng không tồn tại");
  const playerIndex = room.players.findIndex(p => p.userId.toString() === userId.toString());
  if (playerIndex === -1) throw new Error("Bạn không ở trong phòng này");
  const isHost = room.players[playerIndex].isHost;
  room.players.splice(playerIndex, 1);
  if (isHost && room.players.length > 0) {
    room.players[0].isHost = true;
    room.hostId = room.players[0].userId;
  }
  if (room.players.length === 0) {
    await Room.findByIdAndDelete(room._id);
    return null; // phòng bị xóa
  }
  await room.save();
  return toJSON(room);
}
// Cập nhật phòng
async function updateRoom(roomId, data) {
  const room = await Room.findByIdAndUpdate(roomId, data, { new: true });
  if (!room) throw new Error("Không tìm thấy phòng");
  return toJSON(room);
}
// Toggle trạng thái Ready
async function toggleReady({ roomId, isReady, userId }) {
  const room = await Room.findById(roomId);
  if (!room) throw new Error("Phòng không tồn tại");
  const player = room.players.find(p => p.userId.toString() === userId.toString());
  if (!player) throw new Error("Bạn không ở trong phòng này");
  
  // Chủ phòng không cần ready
  if (player.isHost) {
    throw new Error("Chủ phòng không cần sẵn sàng");
  }
  
  player.isReady = isReady;
  
  // Kiểm tra xem tất cả player (trừ chủ phòng) đã ready chưa
  const nonHostPlayers = room.players.filter(p => !p.isHost && !p.isDisconnected);
  const allNonHostReady = nonHostPlayers.length > 0 && nonHostPlayers.every(p => p.isReady);
  
  await room.save();
  return { room: toJSON(room), started: false, allNonHostReady };
}
// Kết thúc trận đấu
async function endGame({ roomId, result }) {
  const room = await Room.findById(roomId);
  if (!room) throw new Error("Phòng không tồn tại");
  // Chuyển về trạng thái waiting để có thể chơi ván mới
  room.status = "waiting";
  if (result) room.result = result; // lưu kết quả nếu có
  // Reset ready status của tất cả players
  room.players.forEach(player => {
    player.isReady = false;
  });
  await room.save();
  return toJSON(room);
}
// Lấy danh sách tất cả phòng
async function getAllRooms() {
  const rooms = await Room.find();
  return rooms.map(toJSON);
}
// Lấy phòng theo ID
async function getRoomById(roomId) {
  const room = await Room.findById(roomId);
  if (!room) throw new Error("Không tìm thấy phòng");
  return toJSON(room);
}

// Tìm phòng mà user đang tham gia
async function findRoomByUserId(userId) {
  const room = await Room.findOne({
    "players.userId": userId,
    status: { $in: ["waiting", "playing"] }
  });
  if (!room) return null;
  return toJSON(room);
}

// Rời tất cả phòng khác của user (trừ phòng hiện tại)
async function leaveAllOtherRooms(userId, currentRoomId) {
  const rooms = await Room.find({
    "players.userId": userId,
    _id: { $ne: currentRoomId },
    status: { $in: ["waiting", "playing"] }
  });

  for (const room of rooms) {
    try {
      await leaveRoom({ roomId: room._id.toString(), userId });
    } catch (err) {
      console.error(`Error leaving room ${room._id}:`, err.message);
    }
  }
}

// Đánh dấu player là disconnected
async function markPlayerDisconnected({ roomId, userId }) {
  const room = await Room.findById(roomId);
  if (!room) return null;
  const player = room.players.find(p => p.userId.toString() === userId.toString());
  if (player) {
    player.isDisconnected = true;
    player.disconnectedAt = new Date();
    await room.save();
  }
  return toJSON(room);
}

// Đánh dấu player là reconnected
async function markPlayerReconnected({ roomId, userId, sessionId }) {
  const room = await Room.findById(roomId);
  if (!room) return null;
  const player = room.players.find(p => p.userId.toString() === userId.toString());
  if (player) {
    player.isDisconnected = false;
    player.disconnectedAt = null;
    player.sessionId = sessionId;
    await room.save();
  }
  return toJSON(room);
}

// Xóa player khỏi phòng (sau khi hết thời gian chờ)
async function removeDisconnectedPlayer({ roomId, userId }) {
  const room = await Room.findById(roomId);
  if (!room) return null;
  const playerIndex = room.players.findIndex(p => p.userId.toString() === userId.toString());
  if (playerIndex === -1) return toJSON(room);
  
  const isHost = room.players[playerIndex].isHost;
  room.players.splice(playerIndex, 1);
  
  if (isHost && room.players.length > 0) {
    room.players[0].isHost = true;
    room.hostId = room.players[0].userId;
  }
  
  if (room.players.length === 0) {
    await Room.findByIdAndDelete(room._id);
    return null;
  }
  
  await room.save();
  return toJSON(room);
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  updateRoom,
  toggleReady,
  endGame,
  getAllRooms,
  getRoomById,
  findRoomByUserId,
  markPlayerDisconnected,
  markPlayerReconnected,
  removeDisconnectedPlayer,
  leaveAllOtherRooms,
};