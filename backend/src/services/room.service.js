// room.service.js
// Xử lý logic phòng chơi Caro.
const Room = require("../models/room.model");
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

// Helper: Lấy ELO từ user data
async function getUserElo(userId) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.gameStats || user.gameStats.length === 0) {
      return 1000; // Default ELO
    }
    const caroStats = user.gameStats.find(s => s.gameId === 'caro') || user.gameStats[0];
    return caroStats?.score || 1000;
  } catch (error) {
    console.error('Error getting user ELO:', error);
    return 1000; // Default ELO on error
  }
}

// Helper: Lấy nickname từ user
async function getUserNickname(userId) {
  try {
    const user = await User.findById(userId).select('nickname username');
    return user?.nickname || user?.username || 'Unknown';
  } catch (error) {
    console.error('Error getting user nickname:', error);
    return 'Unknown';
  }
}

// Helper: convert Mongoose doc sang JSON và populate ELO và nickname cho players
async function toJSON(room) {
  const roomObj = room.toObject({ getters: true });
  
  // Convert playerMarks từ Map sang Object nếu cần
  if (roomObj.playerMarks) {
    if (roomObj.playerMarks instanceof Map) {
      roomObj.playerMarks = Object.fromEntries(roomObj.playerMarks);
    } else if (typeof roomObj.playerMarks === 'object' && roomObj.playerMarks.constructor === Object) {
      // Đã là Object rồi, giữ nguyên
    } else {
      // Fallback: convert sang Object
      roomObj.playerMarks = roomObj.playerMarks || {};
    }
  } else {
    roomObj.playerMarks = {};
  }
  
  // Populate ELO, nickname và avatarUrl cho mỗi player
  if (roomObj.players && roomObj.players.length > 0) {
    const playersWithElo = await Promise.all(
      roomObj.players.map(async (player) => {
        const elo = await getUserElo(player.userId);
        const nickname = await getUserNickname(player.userId);
        // Lấy avatarUrl từ user
        let avatarUrl = null;
        try {
          const user = await User.findById(player.userId).select('avatarUrl');
          avatarUrl = user?.avatarUrl || null;
        } catch (error) {
          console.error('Error getting user avatarUrl:', error);
        }
        return {
          ...player,
          nickname: nickname,
          elo: elo,
          score: elo, // Alias cho compatibility
          avatarUrl: avatarUrl,
        };
      })
    );
    roomObj.players = playersWithElo;
  }
  
  return roomObj;
}
// Tạo phòng mới
async function createRoom({ name, password, maxPlayers, hostId, hostUsername, turnTimeLimit, firstTurn }) {
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  
  // Mặc định: chủ phòng là X, firstTurn = 'X'
  const defaultFirstTurn = firstTurn || 'X';
  const defaultPlayerMarks = {};
  defaultPlayerMarks[hostId.toString()] = 'X'; // Chủ phòng mặc định là X
  
  // Mongoose tự động tạo _id mới (ObjectId) cho mỗi document mới
  const room = await Room.create({
    name: name || `Phòng #${Math.floor(Math.random() * 10000)}`,
    passwordHash,
    hostId,
    maxPlayers: maxPlayers || 2, // Mặc định 2 người
    turnTimeLimit: turnTimeLimit || 30, // Mặc định 30 giây
    firstTurn: defaultFirstTurn, // Mặc định X đi trước
    playerMarks: defaultPlayerMarks, // Chủ phòng mặc định là X
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
  // Mỗi phòng mới sẽ có _id mới duy nhất được Mongoose tự động tạo
  console.log(`Đã tạo phòng mới với ID: ${room._id}, playerMarks:`, defaultPlayerMarks);
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
    // User đã ở trong phòng rồi, không cần kiểm tra password nữa
    // Chỉ cần cập nhật sessionId nếu cần
    if (!existingPlayer.isDisconnected) {
      existingPlayer.sessionId = require("uuid").v4();
      await room.save();
    }
    return toJSON(room);
  }
  
  // Join mới - kiểm tra xem user có đang ở phòng khác không
  const otherRoom = await findRoomByUserId(userId);
  if (otherRoom && otherRoom._id.toString() !== roomId.toString()) {
    // User đang ở phòng khác, tự động rời phòng cũ
    await leaveAllOtherRooms(userId, roomId);
  }

  // Join mới - kiểm tra password (bỏ qua nếu user là host/chủ phòng)
  const isHost = room.hostId && room.hostId.toString() === userId.toString();
  if (!isHost && room.passwordHash && !(await bcrypt.compare(password || "", room.passwordHash))) {
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
  
  // Sau khi thêm player, nếu đây là người chơi thứ 2, khởi tạo mặc định playerMarks và firstTurn
  if (room.players.length === 2) {
    // Reload room để có dữ liệu mới nhất
    const freshRoom = await Room.findById(roomId);
    const currentPlayerMarks = freshRoom.playerMarks instanceof Map 
      ? Object.fromEntries(freshRoom.playerMarks) 
      : (freshRoom.playerMarks || {});
    
    let needsUpdate = false;
    const updateData = {};
    
    // Kiểm tra và gán playerMarks nếu chưa có
    const marksCount = Object.keys(currentPlayerMarks).filter(key => 
      currentPlayerMarks[key] === 'X' || currentPlayerMarks[key] === 'O'
    ).length;
    
    if (marksCount < 2) {
      // Tìm chủ phòng và player còn lại
      const hostPlayer = freshRoom.players.find(p => p.isHost);
      const nonHostPlayer = freshRoom.players.find(p => !p.isHost);
      
      if (hostPlayer && nonHostPlayer) {
        const hostId = hostPlayer.userId.toString();
        const nonHostId = nonHostPlayer.userId.toString();
        
        // Gán mặc định: chủ phòng = X, player còn lại = O
        if (!currentPlayerMarks[hostId] || currentPlayerMarks[hostId] !== 'X') {
          currentPlayerMarks[hostId] = 'X';
          needsUpdate = true;
        }
        if (!currentPlayerMarks[nonHostId] || currentPlayerMarks[nonHostId] !== 'O') {
          currentPlayerMarks[nonHostId] = 'O';
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          updateData.playerMarks = currentPlayerMarks;
          console.log(`Đã tự động khởi tạo playerMarks:`, currentPlayerMarks);
        }
      }
    }
    
    // Kiểm tra và set firstTurn nếu chưa có
    if (!freshRoom.firstTurn || (freshRoom.firstTurn !== 'X' && freshRoom.firstTurn !== 'O')) {
      updateData.firstTurn = 'X'; // Mặc định X đi trước
      needsUpdate = true;
      console.log(`Đã tự động khởi tạo firstTurn: X`);
    }
    
    // Cập nhật nếu cần
    if (needsUpdate) {
      await Room.findByIdAndUpdate(roomId, updateData);
      
      // Reload room để có dữ liệu mới và return
      const updatedRoom = await Room.findById(roomId);
      return toJSON(updatedRoom);
    }
  }
  
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
  const room = await Room.findById(roomId);
  if (!room) throw new Error("Không tìm thấy phòng");
  
  // Cập nhật từng field
  if (data.playerMarks !== undefined) {
    room.playerMarks = data.playerMarks;
  }
  if (data.turnTimeLimit !== undefined) {
    room.turnTimeLimit = data.turnTimeLimit;
  }
  if (data.firstTurn !== undefined) {
    room.firstTurn = data.firstTurn;
  }
  if (data.status !== undefined) {
    room.status = data.status;
  }
  if (data.players !== undefined) {
    room.players = data.players;
  }
  
  await room.save();
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
  return { room: await toJSON(room), started: false, allNonHostReady };
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
// Helper: Format room data cho danh sách (chỉ trả về thông tin cần thiết)
async function formatRoomForList(room) {
  const roomObj = await toJSON(room);
  
  // Chỉ trả về các thông tin cần thiết
  return {
    _id: roomObj._id,
    name: roomObj.name,
    status: roomObj.status,
    maxPlayers: roomObj.maxPlayers,
    hostId: roomObj.hostId,
    hostUsername: roomObj.players?.find(p => p.isHost)?.username || null,
    passwordHash: roomObj.passwordHash ? true : false, // Chỉ trả về boolean, không trả về hash thực
    players: roomObj.players?.map(player => ({
      userId: player.userId,
      username: player.username,
      isHost: player.isHost,
      isReady: player.isReady,
      elo: player.elo || player.score || 1000, // Thêm ELO vào danh sách phòng
      // Không trả về: sessionId, isDisconnected, disconnectedAt, joinedAt
    })) || [],
    createdAt: roomObj.createdAt,
  };
}

// Lấy danh sách tất cả phòng (chỉ trả về thông tin cần thiết)
async function getAllRooms() {
  const rooms = await Room.find();
  return Promise.all(rooms.map(formatRoomForList));
}
// Lấy phòng theo ID
async function getRoomById(roomId) {
  const room = await Room.findById(roomId);
  if (!room) throw new Error("Không tìm thấy phòng");
  return toJSON(room);
}

// Xác minh mật khẩu phòng (không join vào phòng)
async function verifyPassword({ roomId, password, userId }) {
  console.log("RoomService.verifyPassword được gọi:", { 
    roomId, 
    hasPassword: !!password, 
    passwordLength: password?.length,
    userId 
  });
  
  const room = await Room.findById(roomId);
  if (!room) {
    console.error("Không tìm thấy phòng:", roomId);
    throw new Error("Phòng không tồn tại");
  }
  
  if (room.status === "ended") {
    console.error("Phòng đã kết thúc:", roomId);
    throw new Error("Phòng đã kết thúc");
  }
  
  // Nếu user là chủ phòng, không cần kiểm tra mật khẩu
  if (userId && room.hostId && room.hostId.toString() === userId.toString()) {
    console.log("User là chủ phòng, bỏ qua kiểm tra mật khẩu");
    return { valid: true };
  }
  
  // Nếu phòng không có mật khẩu, luôn đúng
  if (!room.passwordHash) {
    console.log("Phòng không có mật khẩu");
    return { valid: true };
  }
  
  // Kiểm tra mật khẩu
  const passwordToCheck = password || "";
  console.log("Đang so sánh mật khẩu:", { 
    providedLength: passwordToCheck.length, 
    hasRoomPassword: !!room.passwordHash 
  });
  
  const isValid = await bcrypt.compare(passwordToCheck, room.passwordHash);
  if (!isValid) {
    console.error("Mật khẩu không khớp");
    throw new Error("Sai mật khẩu");
  }
  
  console.log("Xác thực mật khẩu thành công");
  return { valid: true };
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
  verifyPassword,
  markPlayerDisconnected,
  markPlayerReconnected,
  removeDisconnectedPlayer,
  leaveAllOtherRooms,
};