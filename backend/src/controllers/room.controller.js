// controllers/room.controller.js
const RoomService = require("../services/room.service");
const response = require("../utils/response");
const logger = require("../utils/logger");

// Tạo phòng
async function createRoom(req, res) {
  try {
    const { name, password, turnTimeLimit } = req.body;
    const room = await RoomService.createRoom({
      name,
      password,
      maxPlayers: 2, // Luôn là 2 người
      turnTimeLimit,
      hostId: req.user._id,
      hostUsername: req.user.username || req.user.nickname,
    });
    logger.info(`Tạo phòng ${room._id}`);
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
    const room = await RoomService.joinRoom({
      roomId,
      password,
      userId: req.user._id,
      username: req.user.username,
    });

    req.io.to(room._id.toString()).emit("room:update", room);
    return response.success(res, room, "Tham gia phòng thành công");
  } catch (err) {
    logger.warn("joinRoom failed: %o", err.message);
    return response.error(res, err.message, 400);
  }
}

// Rời phòng
async function leaveRoom(req, res) {
  try {
    const { roomId } = req.body;
    const room = await RoomService.leaveRoom({
      roomId,
      userId: req.user._id,
    });

    if (!room) {
      // req.io.to(roomId.toString()).emit("room:end", { reason: "Phòng trống" });
      return response.success(res, {}, "Bạn đã rời phòng -> Phòng đã bị xóa");
    }

    // req.io.to(room._id.toString()).emit("room:update", room);
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
    const room = await RoomService.updateRoom(roomId, data);
    // req.io.to(room._id.toString()).emit("room:update", room);
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
    const { room, started } = await RoomService.toggleReady({
      roomId,
      isReady,
      userId: req.user._id,
    });

    // req.io.to(room._id.toString()).emit("room:update", room);
    if (started) req.io.to(room._id.toString()).emit("room:start", room);

    return response.success(res, room, "Cập nhật trạng thái thành công");
  } catch (err) {
    logger.error("toggleReady error: %o", err);
    return response.error(res, err.message, 400);
  }
}

// Kết thúc trận đấu
async function endGame(req, res) {
  try {
    const { roomId, result } = req.body;
    const room = await RoomService.endGame({ roomId, result });

    req.io.to(room._id.toString()).emit("room:end", { result, room });
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
    return response.success(res, rooms, "Danh sách phòng");
  } catch (err) {
    logger.error("getRooms error: %o", err);
    return response.error(res, err.message, 400);
  }
}

// Kiểm tra xem user có đang trong phòng nào không
async function checkUserRoom(req, res) {
  try {
    const userId = req.user._id;
    const room = await RoomService.findRoomByUserId(userId);
    
    if (!room) {
      return response.success(res, { inRoom: false, room: null }, "User không đang ở trong phòng nào");
    }
    
    return response.success(res, { inRoom: true, room }, "User đang ở trong phòng");
  } catch (err) {
    logger.error("checkUserRoom error: %o", err);
    return response.error(res, err.message, 400);
  }
}

// Xác minh mật khẩu phòng (không join vào phòng)
async function verifyPassword(req, res) {
  try {
    const { roomId, password } = req.body;
    const userId = req.user._id;
    logger.info("verifyPassword request:", { roomId, hasPassword: !!password, passwordLength: password?.length, userId });
    
    if (!roomId) {
      logger.warn("verifyPassword: roomId is missing");
      return response.error(res, "Thiếu roomId", 400);
    }
    
    const result = await RoomService.verifyPassword({ roomId, password, userId });
    logger.info("verifyPassword success:", { roomId });
    return response.success(res, result, "Mật khẩu đúng");
  } catch (err) {
    logger.warn("verifyPassword failed: %o", err.message);
    return response.error(res, err.message, 400);
  }
}

// Export tất cả hàm
module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  updateRoom,
  toggleReady,
  endGame,
  getRoomList,
  checkUserRoom,
  verifyPassword,
};
