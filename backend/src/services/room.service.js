// room.service.js
// Xử lý logic phòng chơi Caro.

const Room = require("../models/room.model");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

// Tạo phòng mới
async function createRoom({ name, password, maxPlayers, hostId }) {
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  return await Room.create({
    name: name || `Phòng #${Math.floor(Math.random() * 10000)}`,
    passwordHash,
    hostId,
    maxPlayers,
    players: [
      {
        userId: hostId,
        isHost: true,
        isReady: false,
        sessionId: uuidv4(),
      },
    ],
  });
}

// Tham gia phòng
async function joinRoom({ roomId, password, userId }) {
  const room = await Room.findById(roomId);
  if (!room) throw new Error("Phòng không tồn tại");

  if (room.status !== "waiting")
    throw new Error("Phòng đang chơi hoặc đã kết thúc");

  if (
    room.passwordHash &&
    !(await bcrypt.compare(password || "", room.passwordHash))
  )
    throw new Error("Sai mật khẩu");

  if (room.players.some((p) => p.userId.toString() === userId.toString()))
    throw new Error("Bạn đã ở trong phòng");

  if (room.players.length >= room.maxPlayers) throw new Error("Phòng đã đầy");

  room.players.push({
    userId,
    isHost: false,
    isReady: false,
    sessionId: uuidv4(),
  });

  await room.save();
  return room;
}

// Rời phòng
async function leaveRoom({ roomId, userId }) {
  const room = await Room.findById(roomId);
  if (!room) throw new Error("Phòng không tồn tại");

  const playerIndex = room.players.findIndex(
    (p) => p.userId.toString() === userId.toString()
  );
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
  return room;
}

// Cập nhật phòng + chưa hoàn thiện
async function updateRoom(roomId, data) {
  const room = await Room.findByIdAndUpdate(roomId, data, { new: true });
  if (!room) throw new Error("Không tìm thấy phòng");
  return room;
}

// Toggle trạng thái Ready
async function toggleReady({ roomId, isReady, userId }) {
  const room = await Room.findById(roomId);
  if (!room) throw new Error("Phòng không tồn tại");

  const player = room.players.find(
    (p) => p.userId.toString() === userId.toString()
  );
  if (!player) throw new Error("Bạn không ở trong phòng này");

  player.isReady = isReady;

  const allReady =
    room.players.length > 1 && room.players.every((p) => p.isReady);
  if (allReady) room.status = "playing";

  await room.save();
  return { room, started: allReady };
}

// Kết thúc trận đấu
async function endGame({ roomId, result }) {
  const room = await Room.findById(roomId);
  if (!room) throw new Error("Phòng không tồn tại");

  room.status = "ended";
  await room.save();

  return room;
}

// Lấy danh sách tất cả phòng
async function getAllRooms() {
  return await Room.find();
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  updateRoom,
  toggleReady,
  endGame,
  getAllRooms,
};
