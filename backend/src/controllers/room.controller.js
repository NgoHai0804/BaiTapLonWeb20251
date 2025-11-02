// controllers/room.controller.js
const RoomService = require("../services/room.service");
const response = require("../utils/response");
const logger = require("../utils/logger");

// Tạo phòng
async function createRoom(req, res) {
  try {
    const { name, password, maxPlayers } = req.body;
    
    // Kiểm tra tên phòng
    if (!name || name.trim() === "") {
      return response.error(res, "Tên phòng không được để trống", 400);
    }

    const room = await RoomService.createRoom({
      name,
      password,
      maxPlayers: maxPlayers || 2, // Mặc định 2 người chơi
      hostId: req.user._id,
      hostUsername: req.user.username || req.user.nickname,
    });

    logger.info(`Tạo phòng thành công: ${room._id}`);
    return response.success(res, room, "Tạo phòng thành công", 201);
  } catch (err) {
    logger.error("createRoom error: %o", err);
    return response.error(res, err.message, 400);
  }
}

// Tham gia phòng
async function joinRoom(req, res) {
  try {
    const { roomId, password } = req.body;
    if (!roomId) return response.error(res, "Thiếu roomId", 400);

    const room = await RoomService.joinRoom({
      roomId,
      password,
      userId: req.user._id,
      username: req.user.username,
    });

    // Thông báo cho mọi người trong phòng qua Socket.io
    if (req.io) {
      req.io.to(room._id.toString()).emit("room:update", room);
    }
    
    return response.success(res, room, "Tham gia phòng thành công");
  } catch (err) {
    logger.warn("joinRoom failed: %s", err.message);
    return response.error(res, err.message, 400);
  }
}

// Rời phòng
async function leaveRoom(req, res) {
  try {
    const { roomId } = req.body;
    if (!roomId) return response.error(res, "Thiếu roomId", 400);

    const room = await RoomService.leaveRoom({
      roomId,
      userId: req.user._id,
    });

    if (!room) {
      return response.success(res, {}, "Bạn đã rời phòng -> Phòng đã bị xóa");
    }

    if (req.io) {
      req.io.to(room._id.toString()).emit("room:update", room);
    }
    
    return response.success(res, room, "Rời phòng thành công");
  } catch (err) {
    logger.error("leaveRoom error: %o", err);
    return response.error(res, err.message, 400);
  }
}

// Cập nhật phòng
async function updateRoom(req, res) {
  try {
    const { roomId, data } = req.body;
    if (!roomId) return response.error(res, "Thiếu roomId", 400);

    const room = await RoomService.updateRoom(roomId, data);
    
    if (req.io) {
      req.io.to(room._id.toString()).emit("room:update", room);
    }
    
    return response.success(res, room, "Cập nhật phòng thành công");
  } catch (err) {
    logger.error("updateRoom error: %o", err);
    return response.error(res, err.message, 400);
  }
}

// Toggle trạng thái Ready
async function toggleReady(req, res) {
  try {
    const { roomId, isReady } = req.body;
    if (!roomId) return response.error(res, "Thiếu roomId", 400);

    const { room, started } = await RoomService.toggleReady({
      roomId,
      isReady,
      userId: req.user._id,
    });

    if (req.io) {
      req.io.to(room._id.toString()).emit("room:update", room);
      if (started) req.io.to(room._id.toString()).emit("room:start", room);
    }

    return response.success(res, room, "Cập nhật trạng thái sẵn sàng thành công");
  } catch (err) {
    logger.error("toggleReady error: %o", err);
    return response.error(res, err.message, 400);
  }
}

// Kết thúc trận đấu
async function endGame(req, res) {
  try {
    const { roomId, result } = req.body;
    if (!roomId) return response.error(res, "Thiếu roomId", 400);

    const room = await RoomService.endGame({ roomId, result });

    if (req.io) {
      req.io.to(room._id.toString()).emit("room:end", { result, room });
    }
    
    return response.success(res, room, "Trận đấu kết thúc");
  } catch (err) {
    logger.error("endGame error: %o", err);
    return response.error(res, err.message, 400);
  }
}

// Lấy danh sách phòng
async function getRoomList(req, res) {
  try {
    const rooms = await RoomService.getAllRooms();
    return response.success(res, rooms, "Lấy danh sách phòng thành công");
  } catch (err) {
    logger.error("getRooms error: %o", err);
    return response.error(res, err.message, 400);
  }
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  updateRoom,
  toggleReady,
  endGame,
  getRoomList,
};