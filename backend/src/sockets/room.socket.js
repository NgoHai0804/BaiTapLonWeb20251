// room.socket.js

// Điều khiển việc vào/ra phòng và ghép cặp.

// Chức năng:
// "join_room" – người chơi tham gia phòng.
// "leave_room" – rời phòng hoặc khi disconnect.
// "player_ready" – đánh dấu sẵn sàng.
// "start_game" – bắt đầu game (chỉ owner).
// Phát thông báo cho các thành viên phòng khi có thay đổi.

const RoomService = require("../services/room.service");
const UserService = require("../services/user.service");
const { initGameForRoom, getGameState, roomGames } = require("./game.socket");

/** Log helper */
function now() { return `[${new Date().toISOString().replace("T", " ").split(".")[0]}]`; }
function log(msg, data = null) { console.log(now(), msg, data ? JSON.stringify(data, null, 2) : ""); }

/** Map socket.id -> roomId để xử lý disconnect */
const socketToRoom = new Map();

/** Map userId -> timeout để xử lý disconnect delay */
const disconnectTimeouts = new Map();

/** Map để track last ping time cho mỗi player trong phòng đang chơi */
// Format: roomId -> { userId -> lastPingTime }
const roomPlayerPings = new Map();

/** Map để track ping timeout cho mỗi player trong phòng đang chơi */
// Format: roomId_userId -> timeout
const roomPingTimeouts = new Map();

/** Map để track các request join đang xử lý (tránh duplicate) */
const joiningUsers = new Map();

/** ----------------- JOIN ROOM ----------------- */
async function handleJoinRoom(io, socket, data) {
  const { roomId, password } = data;
  const userId = socket.user._id;
  const username = socket.user.username;
  const nickname = socket.user.nickname || socket.user.username;
  const joinKey = `${userId}_${roomId}`;

  // Kiểm tra xem đã có request join đang xử lý chưa
  if (joiningUsers.has(joinKey)) {
    log("join_room request trùng lặp đã bị bỏ qua", { roomId, userId, username });
    return;
  }

  joiningUsers.set(joinKey, true);
  log("Yêu cầu join_room", { roomId, userId, username });

  try {
    // Kiểm tra xem user đã ở trong phòng chưa (trước khi join)
    const roomBefore = await RoomService.getRoomById(roomId.toString());
    const wasAlreadyInRoom = roomBefore?.players?.some((p) => p.userId.toString() === userId.toString());

    const roomAfterJoin = await RoomService.joinRoom({ roomId, password, userId, username });

    const roomIdStr = roomId.toString();
    socketToRoom.set(socket.id, roomIdStr);
    socket.join(roomIdStr);

    // 1️⃣ Emit riêng cho client vừa join (xác nhận thành công)
    socket.emit("join_success", { 
      room: roomAfterJoin,
      message: wasAlreadyInRoom ? "Bạn đã kết nối lại với phòng" : "Bạn đã tham gia phòng thành công",
      timestamp: new Date().toISOString()
    });

    // 2️⃣ Chỉ thông báo cho các user khác nếu user mới tham gia (không phải reconnect)
    if (!wasAlreadyInRoom) {
      socket.to(roomIdStr).emit("player_joined", { 
        userId, 
        username,
        nickname,
        room: roomAfterJoin,
        message: `${nickname} đã tham gia phòng`,
        timestamp: new Date().toISOString() 
      });

      // 3️⃣ Thông báo cho tất cả user trong phòng về sự thay đổi trạng thái phòng
      io.to(roomIdStr).emit("room_update", {
        room: roomAfterJoin,
        message: `${nickname} đã tham gia phòng`,
        timestamp: new Date().toISOString()
      });
    } else {
      // Nếu là reconnect, chỉ cập nhật room cho user đó
      socket.emit("room_update", {
        room: roomAfterJoin,
        message: "Đã kết nối lại với phòng",
        timestamp: new Date().toISOString()
      });
    }

    log("Người chơi đã tham gia thành công", { roomId: roomIdStr, userId, username, wasReconnect: wasAlreadyInRoom });

  } catch (err) {
    log("Lỗi join_room", err.message);
    socket.emit("join_error", { message: err.message });
  } finally {
    // Xóa khỏi map sau 1 giây để cho phép retry nếu cần
    setTimeout(() => {
      joiningUsers.delete(joinKey);
    }, 1000);
  }
}

/** ----------------- PLAYER READY ----------------- */
async function handlePlayerReady(io, socket, data) {
  const { roomId, isReady } = data;
  const userId = socket.user._id;
  const username = socket.user.username;
  const nickname = socket.user.nickname || socket.user.username;
  const roomIdStr = roomId.toString();

  log("player_ready được gọi", { roomId: roomIdStr, userId, username, isReady });

  try {
    const roomBefore = await RoomService.getRoomById(roomIdStr);
    if (!roomBefore) {
      socket.emit("ready_error", { message: "Phòng không tồn tại" });
      return;
    }
    if (roomBefore.status === "playing") {
      socket.emit("ready_error", { message: "Game đã bắt đầu" });
      return;
    }

    const { room: roomAfter, started, allNonHostReady } = await RoomService.toggleReady({ 
      roomId: roomIdStr, 
      isReady: isReady !== undefined ? isReady : true, 
      userId 
    });

    // 1️⃣ Thông báo cho tất cả user trong phòng về sự thay đổi trạng thái ready
    io.to(roomIdStr).emit("player_ready_status", { 
      userId, 
      username,
      isReady: roomAfter.players.find(p => p.userId.toString() === userId.toString())?.isReady || false,
      room: roomAfter,
      allNonHostReady: allNonHostReady,
      message: `${nickname} ${isReady !== false ? 'đã sẵn sàng' : 'đã hủy sẵn sàng'}`,
      timestamp: new Date().toISOString() 
    });

    // 2️⃣ Cập nhật trạng thái phòng cho tất cả user
    io.to(roomIdStr).emit("room_update", {
      room: roomAfter,
      allNonHostReady: allNonHostReady,
      message: `${nickname} ${isReady !== false ? 'đã sẵn sàng' : 'đã hủy sẵn sàng'}`,
      timestamp: new Date().toISOString()
    });

    // Không tự động start game nữa, chủ phòng phải bấm nút start

  } catch (err) {
    log("Lỗi player_ready", err.message);
    socket.emit("ready_error", { message: err.message });
  }
}

/** ----------------- START GAME (chỉ owner) ----------------- */
async function handleStartGame(io, socket, data) {
  const { roomId } = data;
  const userId = socket.user._id;
  const username = socket.user.username;
  const nickname = socket.user.nickname || socket.user.username;
  const roomIdStr = roomId.toString();

  log("start_game được gọi", { roomId: roomIdStr, userId, username, nickname });

  try {
    const room = await RoomService.getRoomById(roomIdStr);
    if (!room) {
      socket.emit("start_error", { message: "Phòng không tồn tại" });
      return;
    }
    if (room.hostId?.toString() !== userId.toString()) {
      socket.emit("start_error", { message: "Chỉ chủ phòng mới có thể bắt đầu game" });
      return;
    }
    if (room.status === "playing") {
      socket.emit("start_error", { message: "Game đã bắt đầu rồi" });
      return;
    }
    if (room.players.length < 2) {
      socket.emit("start_error", { message: "Cần ít nhất 2 người chơi để bắt đầu" });
      return;
    }

    // Kiểm tra xem tất cả player (trừ chủ phòng) đã ready chưa
    const nonHostPlayers = room.players.filter(p => !p.isHost && !p.isDisconnected);
    const allNonHostReady = nonHostPlayers.length > 0 && nonHostPlayers.every(p => p.isReady);
    
    if (!allNonHostReady) {
      socket.emit("start_error", { message: "Tất cả người chơi (trừ chủ phòng) phải sẵn sàng trước khi bắt đầu" });
      return;
    }

    const roomAfter = await RoomService.updateRoom(roomIdStr, { status: "playing" });

    // Khởi tạo game state (async vì cần lưu playerMarks vào DB)
    const gameState = await initGameForRoom(roomIdStr, roomAfter.players);

    // Khởi tạo ping tracking cho tất cả players trong phòng
    if (!roomPlayerPings.has(roomIdStr)) {
      roomPlayerPings.set(roomIdStr, new Map());
    }
    const pingMap = roomPlayerPings.get(roomIdStr);
    const now = Date.now();
    roomAfter.players.forEach(player => {
      if (player.userId) {
        pingMap.set(player.userId.toString(), now);
        // Bắt đầu timeout cho mỗi player (30 giây)
        startPingTimeout(io, roomIdStr, player.userId.toString(), player.username);
      }
    });

    // Bắt đầu timer cho lượt đầu tiên
    const turnTimeLimit = roomAfter.turnTimeLimit || 30;
    try {
      const { startTurnTimer } = require("./game.socket");
      if (startTurnTimer && typeof startTurnTimer === 'function') {
        startTurnTimer(io, roomIdStr, turnTimeLimit);
      } else {
        log("Cảnh báo: startTurnTimer không khả dụng", { roomId: roomIdStr });
      }
    } catch (timerError) {
      log("Lỗi khi bắt đầu turn timer", timerError.message);
      // Không throw error, chỉ log để game vẫn có thể bắt đầu
    }

    // Convert playerMarks Map to Object for JSON
    const playerMarksObj = roomAfter.playerMarks 
      ? (roomAfter.playerMarks instanceof Map 
          ? Object.fromEntries(roomAfter.playerMarks) 
          : roomAfter.playerMarks)
      : {};

    // 1️⃣ Thông báo cho tất cả user trong phòng về việc game bắt đầu
    io.to(roomIdStr).emit("game_start", { 
      players: roomAfter.players,
      room: roomAfter,
      board: gameState.board,
      turn: gameState.turn,
      currentPlayerIndex: gameState.currentPlayerIndex,
      history: gameState.history || [],
      playerMarks: playerMarksObj,
      turnTimeLimit: turnTimeLimit,
      turnStartTime: gameState.turnStartTime, // Gửi turnStartTime để client đồng bộ timer
      firstTurn: roomAfter.firstTurn || 'X',
      message: `${nickname} (chủ phòng) đã bắt đầu game!`,
      timestamp: new Date().toISOString()
    });

    // 2️⃣ Cập nhật trạng thái phòng cho tất cả user
    io.to(roomIdStr).emit("room_update", {
      room: roomAfter,
      message: "Game đã bắt đầu",
      timestamp: new Date().toISOString()
    });

    // 3️⃣ Cập nhật status = 'in_game' cho tất cả players
    try {
      roomAfter.players.forEach(async (player) => {
        if (player.userId) {
          await UserService.updateUserStatus(player.userId.toString(), "in_game");
        }
      });
    } catch (statusError) {
      log("Lỗi khi cập nhật trạng thái player thành in_game", statusError.message);
    }

    log("Game đã được bắt đầu bởi chủ phòng", { roomId: roomIdStr, userId, username });

  } catch (err) {
    log("Lỗi start_game", err.message);
    log("Stack trace lỗi start_game", err.stack);
    socket.emit("start_error", { 
      message: err.message || "Có lỗi xảy ra khi bắt đầu game",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

/** ----------------- UPDATE ROOM SETTINGS ----------------- */
async function handleUpdateRoomSettings(io, socket, data) {
  const { roomId, playerMarks, turnTimeLimit, firstTurn } = data;
  const userId = socket.user._id;
  const username = socket.user.username;
  const nickname = socket.user.nickname || socket.user.username;
  const roomIdStr = roomId.toString();

  log("update_room_settings được gọi", { roomId: roomIdStr, userId, username, playerMarks, turnTimeLimit, firstTurn });

  try {
    const room = await RoomService.getRoomById(roomIdStr);
    if (!room) {
      socket.emit("room_settings_error", { message: "Phòng không tồn tại" });
      return;
    }

    // Chỉ chủ phòng mới có thể chỉnh sửa
    if (room.hostId?.toString() !== userId.toString()) {
      socket.emit("room_settings_error", { message: "Chỉ chủ phòng mới có thể chỉnh sửa cài đặt" });
      return;
    }

    // Chỉ cho phép chỉnh sửa khi phòng đang ở trạng thái "waiting"
    if (room.status !== "waiting") {
      socket.emit("room_settings_error", { message: "Chỉ có thể chỉnh sửa cài đặt khi phòng chưa bắt đầu game" });
      return;
    }

    // Validate playerMarks nếu có
    if (playerMarks) {
      const marks = Object.values(playerMarks);
      const xCount = marks.filter(m => m === 'X').length;
      const oCount = marks.filter(m => m === 'O').length;
      
      if (room.players.length >= 2) {
        if (xCount !== 1 || oCount !== 1) {
          socket.emit("room_settings_error", { message: "Phải có đúng 1 người chơi X và 1 người chơi O" });
          return;
        }
      }
    }

    // Validate turnTimeLimit nếu có
    if (turnTimeLimit !== undefined) {
      if (turnTimeLimit < 10 || turnTimeLimit > 300) {
        socket.emit("room_settings_error", { message: "Thời gian mỗi lượt phải từ 10 đến 300 giây" });
        return;
      }
    }

    // Validate firstTurn nếu có
    if (firstTurn !== undefined) {
      if (firstTurn !== 'X' && firstTurn !== 'O') {
        socket.emit("room_settings_error", { message: "Người đi trước phải là X hoặc O" });
        return;
      }
    }

    // Cập nhật room
    const updateData = {};
    if (playerMarks) {
      updateData.playerMarks = playerMarks;
    }
    if (turnTimeLimit !== undefined) {
      updateData.turnTimeLimit = turnTimeLimit;
    }
    if (firstTurn !== undefined) {
      updateData.firstTurn = firstTurn;
    }

    const roomAfter = await RoomService.updateRoom(roomIdStr, updateData);

    // Convert playerMarks Map to Object for JSON
    const playerMarksObj = roomAfter.playerMarks 
      ? (roomAfter.playerMarks instanceof Map 
          ? Object.fromEntries(roomAfter.playerMarks) 
          : roomAfter.playerMarks)
      : {};

    // Thông báo cho tất cả user trong phòng
    io.to(roomIdStr).emit("room_settings_updated", {
      room: roomAfter,
      playerMarks: playerMarksObj,
      turnTimeLimit: roomAfter.turnTimeLimit,
      firstTurn: roomAfter.firstTurn || 'X',
      message: `${nickname} đã cập nhật cài đặt phòng`,
      timestamp: new Date().toISOString()
    });

    io.to(roomIdStr).emit("room_update", {
      room: roomAfter,
      message: "Cài đặt phòng đã được cập nhật",
      timestamp: new Date().toISOString()
    });

    log("Cài đặt phòng đã được cập nhật", { roomId: roomIdStr, userId, username });

  } catch (err) {
    log("Lỗi update_room_settings", err.message);
    socket.emit("room_settings_error", { message: err.message });
  }
}

/** ----------------- LEAVE ROOM ----------------- */
async function handleLeaveRoom(io, socket, data) {
  const { roomId } = data;
  const userId = socket.user._id;
  const username = socket.user.username;
  const nickname = socket.user.nickname || socket.user.username;
  const roomIdStr = roomId.toString();

  log("leave_room được gọi", { roomId: roomIdStr, userId, username, nickname });

  try {
    const roomBefore = await RoomService.getRoomById(roomIdStr);
    if (!roomBefore) {
      socket.emit("leave_error", { message: "Phòng không tồn tại" });
      return;
    }

    // Nếu đang chơi, tự động kết thúc game với kết quả là người còn lại thắng
    if (roomBefore.status === "playing") {
      log("Người chơi rời phòng khi đang chơi - tự động đầu hàng", { roomId: roomIdStr, userId, username });
      
      // Tìm người chơi còn lại (người thắng)
      const winner = roomBefore.players.find(p => p.userId.toString() !== userId.toString());
      const winnerNickname = winner?.nickname || winner?.username || "Đối thủ";
      
      if (winner) {
        const gameResult = {
          winner: winner.userId,
          winnerUsername: winner.username,
          winnerNickname: winnerNickname,
          loser: userId,
          loserUsername: username,
          loserNickname: nickname,
          message: `${nickname} đã rời phòng. ${winnerNickname} thắng!`,
          isSurrender: true,
          isLeaveRoom: true
        };

        // Kết thúc game
        await RoomService.endGame({ 
          roomId: roomIdStr, 
          result: gameResult 
        });

        // Cập nhật gameStats cho người thắng và thua
        try {
          if (winner.userId) {
            await UserService.updateGameStats(winner.userId, "caro", true, false);
          }
          if (userId) {
            await UserService.updateGameStats(userId, "caro", false, false);
          }
        } catch (statsError) {
          log("updateGameStats error when leaving room", statsError.message);
          // Không block leave room nếu update stats lỗi
        }

        // Lấy game state nếu có
        const game = getGameState(roomIdStr);
        const roomAfterEnd = await RoomService.getRoomById(roomIdStr);

        // Thông báo game_end cho tất cả user trong phòng
        io.to(roomIdStr).emit("game_end", {
          result: gameResult,
          board: game?.board || null,
          message: `${nickname} đã rời phòng. ${winnerNickname} thắng!`,
          timestamp: new Date().toISOString()
        });

        // Cập nhật trạng thái phòng
        io.to(roomIdStr).emit("room_update", {
          room: roomAfterEnd,
          message: "Game đã kết thúc",
          timestamp: new Date().toISOString()
        });

        // Cập nhật status = 'online' cho tất cả players (nếu vẫn còn socket)
        try {
          roomAfterEnd.players.forEach(async (player) => {
            if (player.userId) {
              await UserService.updateUserStatus(player.userId.toString(), "online");
            }
          });
        } catch (statusError) {
          log("Error updating player status to online when leaving room", statusError.message);
        }

        // Cleanup ping tracking cho tất cả players
        cleanupAllPingTracking(roomIdStr);

        // Xóa game state
        if (game && roomGames[roomIdStr]) {
          delete roomGames[roomIdStr];
        }

        log("Game ended - player left room", { roomId: roomIdStr, winner: winner.username, loser: username });
      }
    }

    // Rời phòng như bình thường
    const roomAfter = await RoomService.leaveRoom({ roomId: roomIdStr, userId });

    socketToRoom.delete(socket.id);
    socket.leave(roomIdStr);

    // Cleanup ping tracking khi rời phòng
    cleanupPingTracking(roomIdStr, userId.toString());

    // Cập nhật status = 'online' khi rời phòng (nếu không đang chơi)
    if (roomBefore.status !== "playing") {
      try {
        await UserService.updateUserStatus(userId.toString(), "online");
      } catch (statusError) {
        log("Error updating user status to online when leaving room", statusError.message);
      }
    }

    // 1️⃣ Thông báo cho user vừa rời phòng
    socket.emit("leave_success", { 
      message: roomBefore.status === "playing" ? "Bạn đã rời phòng (tự động thua)" : "Bạn đã rời phòng",
      timestamp: new Date().toISOString()
    });

    if (roomAfter) {
      // 2️⃣ Thông báo cho các user khác trong phòng về việc player rời phòng
      io.to(roomIdStr).emit("player_left", { 
        userId, 
        username,
        nickname,
        room: roomAfter,
        message: `${nickname} đã rời phòng`,
        timestamp: new Date().toISOString() 
      });

      // 3️⃣ Cập nhật trạng thái phòng cho tất cả user còn lại
      io.to(roomIdStr).emit("room_update", {
        room: roomAfter,
        message: `${nickname} đã rời phòng`,
        timestamp: new Date().toISOString()
      });
    } else {
      // Phòng đã bị xóa (không còn ai) - thông báo cho tất cả user đã rời
      io.to(roomIdStr).emit("room_deleted", {
        message: "Phòng đã bị xóa vì không còn người chơi",
        timestamp: new Date().toISOString()
      });
      log("Room deleted (empty)", { roomId: roomIdStr });
    }

    log("Player left successfully", { roomId: roomIdStr, userId, username });

  } catch (err) {
    log("leave_room error", err.message);
    socket.emit("leave_error", { message: err.message });
  }
}

/** ----------------- DISCONNECT ----------------- */
async function handleDisconnect(io, socket) {
  const roomIdStr = socketToRoom.get(socket.id);
  if (!roomIdStr) {
    log("disconnect - no room", { socketId: socket.id });
    return;
  }

  const userId = socket.user?._id;
  const username = socket.user?.username || "Unknown";
  const nickname = socket.user?.nickname || socket.user?.username || "Unknown";

  try {
    const room = await RoomService.getRoomById(roomIdStr);
    if (!room) {
      socketToRoom.delete(socket.id);
      return;
    }

    const player = room.players.find(p => p.userId.toString() === userId?.toString());
    if (!player) {
      socketToRoom.delete(socket.id);
      return;
    }

    // Xóa timeout cũ nếu có (trường hợp reconnect trước khi hết thời gian chờ)
    const existingTimeout = disconnectTimeouts.get(userId.toString());
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      disconnectTimeouts.delete(userId.toString());
    }

    // Kiểm tra số lượng player trong phòng
    const activePlayers = room.players.filter(p => !p.isDisconnected);
    
    // Nếu phòng chỉ có 1 user và user đó disconnect, tự động hủy phòng
    if (activePlayers.length === 1 && activePlayers[0].userId.toString() === userId.toString()) {
      // Xóa phòng ngay lập tức
      await Room.findByIdAndDelete(roomIdStr);
      io.to(roomIdStr).emit("room_deleted", {
        message: "Phòng đã bị hủy vì chủ phòng đã ngắt kết nối",
        timestamp: new Date().toISOString()
      });
      socketToRoom.delete(socket.id);
      socket.leave(roomIdStr);
      log("Room deleted (only 1 player disconnected)", { roomId: roomIdStr, userId, username });
      return;
    }

      // Đánh dấu player là disconnected (không xóa ngay)
    await RoomService.markPlayerDisconnected({ roomId: roomIdStr, userId });
    const roomAfterDisconnect = await RoomService.getRoomById(roomIdStr);

    // Thông báo cho các user khác trong phòng
    if (roomAfterDisconnect) {
      io.to(roomIdStr).emit("player_disconnected", { 
        userId, 
        username,
        nickname,
        room: roomAfterDisconnect,
        message: `${nickname} đã ngắt kết nối (đang chờ kết nối lại...)`,
        timestamp: new Date().toISOString() 
      });

      io.to(roomIdStr).emit("room_update", {
        room: roomAfterDisconnect,
        message: `${nickname} đã ngắt kết nối`,
        timestamp: new Date().toISOString()
      });
    }

    socketToRoom.delete(socket.id);
    socket.leave(roomIdStr);

    // Nếu đang chơi, cleanup ping tracking ngay khi disconnect
    if (room.status === "playing") {
      cleanupPingTracking(roomIdStr, userId.toString());
    }

    // Đợi 20 giây (15-30s) trước khi xóa player khỏi phòng
    const disconnectTimeout = setTimeout(async () => {
      try {
        const roomCheck = await RoomService.getRoomById(roomIdStr);
        if (!roomCheck) {
          disconnectTimeouts.delete(userId.toString());
          return;
        }

        const playerCheck = roomCheck.players.find(p => 
          p.userId.toString() === userId.toString() && p.isDisconnected
        );
        
        // Chỉ xóa nếu player vẫn còn disconnected
        if (playerCheck) {
          const playerNickname = playerCheck?.nickname || playerCheck?.username || nickname;
          const roomAfter = await RoomService.removeDisconnectedPlayer({ 
            roomId: roomIdStr, 
            userId 
          });

          if (roomAfter) {
            io.to(roomIdStr).emit("player_left", { 
              userId, 
              username,
              nickname: playerNickname,
              room: roomAfter,
              message: `${playerNickname} đã rời phòng (hết thời gian chờ)`,
              timestamp: new Date().toISOString() 
            });

            io.to(roomIdStr).emit("room_update", {
              room: roomAfter,
              message: `${playerNickname} đã rời phòng`,
              timestamp: new Date().toISOString()
            });
          } else {
            // Phòng đã bị xóa
            io.to(roomIdStr).emit("room_deleted", {
              message: "Phòng đã bị xóa vì không còn người chơi",
              timestamp: new Date().toISOString()
            });
          }
        }
        
        disconnectTimeouts.delete(userId.toString());
        log("Player removed after disconnect timeout", { roomId: roomIdStr, userId, username });
      } catch (err) {
        log("Error removing disconnected player", err.message);
        disconnectTimeouts.delete(userId.toString());
      }
    }, 20000); // 20 giây

    disconnectTimeouts.set(userId.toString(), disconnectTimeout);
    log("player disconnected (waiting for reconnect)", { roomId: roomIdStr, userId, username });

  } catch (err) {
    log("disconnect error", err.message);
    socketToRoom.delete(socket.id);
  }
}

/** ----------------- PING ROOM (Khi đang chơi) ----------------- */
async function handlePingRoom(io, socket, data) {
  const { roomId } = data;
  const userId = socket.user._id.toString();
  const roomIdStr = roomId?.toString();

  try {
    const room = await RoomService.getRoomById(roomIdStr);
    if (!room || room.status !== "playing") {
      return; // Không phải đang chơi, không cần ping
    }

    // Cập nhật last ping time
    if (!roomPlayerPings.has(roomIdStr)) {
      roomPlayerPings.set(roomIdStr, new Map());
    }
    const pingMap = roomPlayerPings.get(roomIdStr);
    pingMap.set(userId, Date.now());

    // Xóa timeout cũ và tạo timeout mới
    const timeoutKey = `${roomIdStr}_${userId}`;
    const existingTimeout = roomPingTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Bắt đầu timeout mới (30 giây)
    const player = room.players.find(p => p.userId.toString() === userId);
    if (player) {
      startPingTimeout(io, roomIdStr, userId, player.username);
    }

    // Trả về pong với thời gian còn lại trước khi timeout
    const timeout = roomPingTimeouts.get(timeoutKey);
    const timeRemaining = timeout ? 30000 : 0; // 30 giây
    
    socket.emit("room_pong", { 
      roomId: roomIdStr, 
      timestamp: Date.now(),
      timeRemaining: timeRemaining
    });
  } catch (err) {
    log("ping_room error", err.message);
  }
}

/** ----------------- AUTO REMOVE PLAYER ON TIMEOUT ----------------- */
async function autoRemovePlayerOnTimeout(io, roomIdStr, userId, username) {
  try {
    const RoomService = require("../services/room.service");
    const UserService = require("../services/user.service");
    const { getGameState } = require("./game.socket");
    
    const room = await RoomService.getRoomById(roomIdStr);
    if (!room || room.status !== "playing") {
      return;
    }

    const player = room.players.find(p => p.userId.toString() === userId.toString());
    if (!player) {
      return;
    }

    // Tìm người chơi còn lại (người thắng)
    const winner = room.players.find(p => p.userId.toString() !== userId.toString());
    const winnerNickname = winner?.nickname || winner?.username || "Đối thủ";
    const playerNickname = player?.nickname || player?.username || username;
    const nickname = playerNickname;
    
    // Nếu đang chơi, kết thúc game trước
    if (room.status === "playing") {
      const gameResult = {
        winner: winner?.userId || null,
        winnerUsername: winner?.username || "Đối thủ",
        winnerNickname: winnerNickname,
        loser: userId,
        loserUsername: username,
        loserNickname: nickname,
        message: `${nickname} đã mất kết nối quá lâu và bị đẩy ra khỏi phòng. ${winnerNickname} thắng!`,
        isTimeout: true
      };

      await RoomService.endGame({ 
        roomId: roomIdStr, 
        result: gameResult 
      });

      // Cập nhật gameStats cho người thắng và thua (timeout)
      try {
        if (winner?.userId) {
          await UserService.updateGameStats(winner.userId, "caro", true, false);
        }
        if (userId) {
          await UserService.updateGameStats(userId, "caro", false, false);
        }
      } catch (statsError) {
        log("updateGameStats error on timeout", statsError.message);
      }

      // Thông báo game end
      const game = getGameState(roomIdStr);
      io.to(roomIdStr).emit("game_end", {
        result: gameResult,
        board: game?.board || null,
        message: `${playerNickname} đã mất kết nối quá lâu`,
        timestamp: new Date().toISOString()
      });
    }

    // Đẩy player ra khỏi phòng
    const roomAfter = await RoomService.removeDisconnectedPlayer({ 
      roomId: roomIdStr, 
      userId 
    });

    if (roomAfter) {
      // Thông báo player bị đẩy ra
      io.to(roomIdStr).emit("player_left", { 
        userId, 
        username,
        nickname: playerNickname,
        room: roomAfter,
        message: `${playerNickname} đã bị đẩy ra khỏi phòng do mất kết nối quá lâu`,
        timestamp: new Date().toISOString() 
      });

      io.to(roomIdStr).emit("room_update", {
        room: roomAfter,
        message: `${playerNickname} đã bị đẩy ra khỏi phòng`,
        timestamp: new Date().toISOString()
      });
    } else {
      // Phòng đã bị xóa
      io.to(roomIdStr).emit("room_deleted", {
        message: "Phòng đã bị xóa vì không còn người chơi",
        timestamp: new Date().toISOString()
      });
    }

    // Cleanup ping tracking
    cleanupPingTracking(roomIdStr, userId);

    log("Player removed - timeout", { roomId: roomIdStr, userId, username });
  } catch (err) {
    log("autoRemovePlayerOnTimeout error", err.message);
  }
}

/** ----------------- START PING TIMEOUT ----------------- */
function startPingTimeout(io, roomIdStr, userId, username) {
  const timeoutKey = `${roomIdStr}_${userId}`;
  
  // Xóa timeout cũ nếu có
  const existingTimeout = roomPingTimeouts.get(timeoutKey);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Tạo timeout mới (30 giây)
  const timeout = setTimeout(async () => {
    try {
      const room = await RoomService.getRoomById(roomIdStr);
      if (!room || room.status !== "playing") {
        roomPingTimeouts.delete(timeoutKey);
        return; // Không phải đang chơi nữa
      }

      // Kiểm tra xem player có còn trong phòng không
      const player = room.players.find(p => p.userId.toString() === userId);
      if (!player) {
        roomPingTimeouts.delete(timeoutKey);
        return;
      }

      // Kiểm tra last ping time
      const pingMap = roomPlayerPings.get(roomIdStr);
      if (pingMap) {
        const lastPing = pingMap.get(userId);
        const now = Date.now();
        // Nếu không có ping trong 30 giây, tự động đầu hàng
        if (!lastPing || (now - lastPing) > 30000) {
          log("Player timeout - auto surrender", { roomId: roomIdStr, userId, username });
          
          // Tự động đẩy player ra khỏi phòng
          await autoRemovePlayerOnTimeout(io, roomIdStr, userId, username);
        }
      }
    } catch (err) {
      log("Ping timeout error", err.message);
      roomPingTimeouts.delete(timeoutKey);
    }
  }, 30000); // 30 giây

  roomPingTimeouts.set(timeoutKey, timeout);
}

/** ----------------- CLEANUP PING TRACKING ----------------- */
function cleanupPingTracking(roomIdStr, userId) {
  const timeoutKey = `${roomIdStr}_${userId}`;
  const timeout = roomPingTimeouts.get(timeoutKey);
  if (timeout) {
    clearTimeout(timeout);
    roomPingTimeouts.delete(timeoutKey);
  }

  const pingMap = roomPlayerPings.get(roomIdStr);
  if (pingMap) {
    pingMap.delete(userId);
    if (pingMap.size === 0) {
      roomPlayerPings.delete(roomIdStr);
    }
  }
}

/** ----------------- CLEANUP ALL PING TRACKING FOR ROOM ----------------- */
function cleanupAllPingTracking(roomIdStr) {
  const pingMap = roomPlayerPings.get(roomIdStr);
  if (pingMap) {
    // Cleanup tất cả timeouts cho phòng này
    pingMap.forEach((_, userId) => {
      const timeoutKey = `${roomIdStr}_${userId}`;
      const timeout = roomPingTimeouts.get(timeoutKey);
      if (timeout) {
        clearTimeout(timeout);
        roomPingTimeouts.delete(timeoutKey);
      }
    });
    roomPlayerPings.delete(roomIdStr);
  }
}

/** ----------------- CHECK AND RECONNECT ----------------- */
async function handleCheckAndReconnect(io, socket) {
  const userId = socket.user?._id;
  const username = socket.user?.username || "Unknown";
  const nickname = socket.user?.nickname || socket.user?.username || "Unknown";

  try {
    // Tìm phòng mà user đang tham gia
    const room = await RoomService.findRoomByUserId(userId);
    
    if (!room) {
      socket.emit("reconnect_check", { 
        inRoom: false,
        message: "Bạn không có trong phòng nào"
      });
      return;
    }

    // Kiểm tra xem player có đang disconnected không
    const player = room.players.find(p => p.userId.toString() === userId.toString());
    if (!player) {
      socket.emit("reconnect_check", { 
        inRoom: false,
        message: "Không tìm thấy thông tin người chơi"
      });
      return;
    }

    // Nếu player đang disconnected, đánh dấu là reconnected
    if (player.isDisconnected) {
      // Xóa timeout disconnect nếu có
      const existingTimeout = disconnectTimeouts.get(userId.toString());
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        disconnectTimeouts.delete(userId.toString());
      }

      // Đánh dấu reconnected
      const sessionId = require("uuid").v4();
      await RoomService.markPlayerReconnected({ 
        roomId: room._id, 
        userId, 
        sessionId 
      });
      
      const roomAfter = await RoomService.getRoomById(room._id);
      const roomIdStr = room._id.toString();
      
      // Join lại socket room
      socketToRoom.set(socket.id, roomIdStr);
      socket.join(roomIdStr);

      // Lấy game state nếu đang chơi
      let gameState = null;
      if (roomAfter.status === "playing") {
        const { getGameState } = require("./game.socket");
        const game = getGameState(roomIdStr);
        if (game) {
          gameState = {
            board: game.board,
            turn: game.turn,
            history: game.history,
            currentPlayerIndex: game.currentPlayerIndex,
          };
          
          // Khởi tạo lại ping tracking cho player này
          if (!roomPlayerPings.has(roomIdStr)) {
            roomPlayerPings.set(roomIdStr, new Map());
          }
          const pingMap = roomPlayerPings.get(roomIdStr);
          pingMap.set(userId.toString(), Date.now());
          startPingTimeout(io, roomIdStr, userId.toString(), username);
        }
      }

      // Thông báo cho user
      socket.emit("reconnect_success", {
        room: roomAfter,
        gameState: gameState,
        message: "Đã kết nối lại với phòng thành công",
        timestamp: new Date().toISOString()
      });

      // Thông báo cho các user khác
      socket.to(roomIdStr).emit("player_reconnected", {
        userId,
        username,
        nickname,
        room: roomAfter,
        message: `${nickname} đã kết nối lại`,
        timestamp: new Date().toISOString()
      });

      io.to(roomIdStr).emit("room_update", {
        room: roomAfter,
        message: `${nickname} đã kết nối lại`,
        timestamp: new Date().toISOString()
      });

      log("Player reconnected", { roomId: roomIdStr, userId, username });
    } else {
      // Player chưa disconnected, chỉ cần join lại socket room
      const roomIdStr = room._id.toString();
      socketToRoom.set(socket.id, roomIdStr);
      socket.join(roomIdStr);

      // Lấy game state nếu đang chơi
      let gameState = null;
      if (room.status === "playing") {
        const { getGameState } = require("./game.socket");
        const game = getGameState(room._id.toString());
        if (game) {
          gameState = {
            board: game.board,
            turn: game.turn,
            history: game.history,
            currentPlayerIndex: game.currentPlayerIndex,
          };
          
          // Khởi tạo lại ping tracking cho player này
          if (!roomPlayerPings.has(room._id.toString())) {
            roomPlayerPings.set(room._id.toString(), new Map());
          }
          const pingMap = roomPlayerPings.get(room._id.toString());
          pingMap.set(userId.toString(), Date.now());
          startPingTimeout(io, room._id.toString(), userId.toString(), username);
        }
      }

      socket.emit("reconnect_check", {
        inRoom: true,
        room: room,
        gameState: gameState,
        message: "Bạn vẫn đang trong phòng"
      });
    }
  } catch (err) {
    log("reconnect check error", err.message);
    socket.emit("reconnect_check", {
      inRoom: false,
      error: err.message
    });
  }
}

/** ----------------- INVITE TO ROOM ----------------- */
async function handleInviteToRoom(io, socket, data) {
  const { roomId, friendId } = data;
  const userId = socket.user._id;
  const username = socket.user.username;
  const roomIdStr = roomId?.toString();
  const friendIdStr = friendId?.toString();

  log("invite_to_room", { roomId: roomIdStr, inviter: username, friendId: friendIdStr });

  try {
    if (!roomIdStr || !friendIdStr) {
      socket.emit("invite_error", { message: "Thiếu roomId hoặc friendId" });
      return;
    }

    const room = await RoomService.getRoomById(roomIdStr);
    if (!room) {
      socket.emit("invite_error", { message: "Phòng không tồn tại" });
      return;
    }

    // Kiểm tra xem user có trong phòng không
    const inviter = room.players.find(p => p.userId.toString() === userId.toString());
    if (!inviter) {
      socket.emit("invite_error", { message: "Bạn không ở trong phòng này" });
      return;
    }

    // Gửi notification cho người được mời (chỉ gửi đến friendId, không gửi cho người mời)
    const inviteData = {
      roomId: roomIdStr,
      roomName: room.name,
      inviterId: userId.toString(),
      inviter: {
        _id: userId,
        username: username,
        nickname: socket.user.nickname,
        avatarUrl: socket.user.avatarUrl,
      },
      timestamp: new Date().toISOString(),
    };
    
    log("Sending room invite", { to: friendIdStr, roomId: roomIdStr, inviter: username });
    io.to(friendIdStr).emit("room:invite", inviteData);

    // Xác nhận cho người gửi
    socket.emit("invite_success", {
      message: `Đã gửi lời mời đến ${friendIdStr}`,
      timestamp: new Date().toISOString(),
    });

    log("Room invite sent", { roomId: roomIdStr, inviter: username, friendId: friendIdStr });
  } catch (err) {
    log("invite_to_room error", err.message);
    socket.emit("invite_error", { message: err.message });
  }
}

/** ----------------- EXPORT MODULE ----------------- */
function roomSocket(io, socket) {
  socket.on("join_room", (data) => handleJoinRoom(io, socket, data));
  socket.on("player_ready", (data) => handlePlayerReady(io, socket, data));
  socket.on("start_game", (data) => handleStartGame(io, socket, data));
  socket.on("leave_room", (data) => handleLeaveRoom(io, socket, data));
  socket.on("invite_to_room", (data) => handleInviteToRoom(io, socket, data));
  socket.on("check_reconnect", () => handleCheckAndReconnect(io, socket));
  socket.on("ping_room", (data) => handlePingRoom(io, socket, data));
  socket.on("ping_server", () => socket.emit("pong", { message: "Pong from server!" }));
  socket.on("update_room_settings", (data) => handleUpdateRoomSettings(io, socket, data));
  socket.on("disconnect", () => handleDisconnect(io, socket));
}

module.exports = roomSocket;
module.exports.cleanupAllPingTracking = cleanupAllPingTracking;

