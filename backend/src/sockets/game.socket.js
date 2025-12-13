// game.socket.js

// Xử lý logic chơi game Caro.

// Chức năng:
// "make_move" – người chơi đánh cờ tại vị trí (x, y).
// "undo_move" – hoàn tác nước đi (chỉ vs Bot).
// "reset_game" – reset bàn cờ (chỉ owner).
// Kiểm tra thắng thua và thông báo kết quả.

const RoomService = require("../services/room.service");
const UserService = require("../services/user.service");
const { checkWinner } = require("../utils/checkWinner");

/** Log helper */
function now() { return `[${new Date().toISOString().replace("T", " ").split(".")[0]}]`; }
function log(msg, data = null) { console.log(now(), msg, data ? JSON.stringify(data, null, 2) : ""); }

/** Helper: Cập nhật status = 'online' cho tất cả players trong room sau khi game end */
async function updatePlayersStatusToOnline(roomIdStr) {
  try {
    const room = await RoomService.getRoomById(roomIdStr);
    if (!room || !room.players) return;
    
    for (const player of room.players) {
      if (player.userId) {
        await UserService.updateUserStatus(player.userId.toString(), "online");
      }
    }
  } catch (err) {
    log("Lỗi khi cập nhật trạng thái players thành online sau khi game kết thúc", err.message);
  }
}

/** Board memory - lưu trữ trạng thái game của mỗi phòng */
const roomGames = {};
const socketToRoom = new Map();
/** Map để theo dõi turn timer cho mỗi phòng */
// Format: roomId -> timeout
const roomTurnTimers = new Map();

/** ----------------- START TURN TIMER ----------------- */
function startTurnTimer(io, roomIdStr, turnTimeLimit) {
  // Xóa timer cũ nếu có
  const existingTimer = roomTurnTimers.get(roomIdStr);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Tạo timer mới
  const timer = setTimeout(async () => {
    try {
      const room = await RoomService.getRoomById(roomIdStr);
      if (!room || room.status !== "playing") {
        roomTurnTimers.delete(roomIdStr);
        return;
      }

      const game = getGameState(roomIdStr);
      if (!game) {
        roomTurnTimers.delete(roomIdStr);
        return;
      }

      // Tìm người chơi hiện tại (người hết thời gian)
      const currentPlayer = room.players[game.currentPlayerIndex];
      if (!currentPlayer) {
        roomTurnTimers.delete(roomIdStr);
        return;
      }

      // Tìm người chơi còn lại (người thắng)
      const winner = room.players.find(p => p.userId.toString() !== currentPlayer.userId.toString());
      const winnerNickname = winner?.nickname || winner?.username || "Đối thủ";
      const loserNickname = currentPlayer?.nickname || currentPlayer?.username || "Người chơi";

      // Tự động đầu hàng do hết thời gian
      const gameResult = {
        winner: winner?.userId || null,
        winnerUsername: winner?.username || "Đối thủ",
        winnerNickname: winnerNickname,
        loser: currentPlayer.userId,
        loserUsername: currentPlayer.username,
        loserNickname: loserNickname,
        message: `${loserNickname} đã hết thời gian. ${winnerNickname} thắng!`,
        isTimeout: true,
        isTurnTimeout: true
      };

      await RoomService.endGame({ 
        roomId: roomIdStr, 
        result: gameResult 
      });

      // Cập nhật gameStats
      try {
        if (winner?.userId) {
          await UserService.updateGameStats(winner.userId, "caro", true, false);
        }
        if (currentPlayer.userId) {
          await UserService.updateGameStats(currentPlayer.userId, "caro", false, false);
        }
      } catch (statsError) {
        log("updateGameStats error on turn timeout", statsError.message);
      }

      // Thông báo game end
      io.to(roomIdStr).emit("game_end", {
        result: gameResult,
        board: game.board,
        message: gameResult.message,
        timestamp: new Date().toISOString()
      });

      const roomAfter = await RoomService.getRoomById(roomIdStr);
      io.to(roomIdStr).emit("room_update", {
        room: roomAfter,
        message: "Game đã kết thúc",
        timestamp: new Date().toISOString()
      });

      // Cập nhật status = 'online' cho tất cả players
      await updatePlayersStatusToOnline(roomIdStr);

      // Cleanup
      const { cleanupAllPingTracking } = require("./room.socket");
      cleanupAllPingTracking(roomIdStr);
      roomTurnTimers.delete(roomIdStr);

      log("Game ended - turn timeout", { roomId: roomIdStr, loser: currentPlayer.userId });
    } catch (err) {
      log("Lỗi turn timer", err.message);
      roomTurnTimers.delete(roomIdStr);
    }
  }, turnTimeLimit * 1000); // Convert to milliseconds

  roomTurnTimers.set(roomIdStr, timer);
  return timer;
}

/** ----------------- STOP TURN TIMER ----------------- */
function stopTurnTimer(roomIdStr) {
  const timer = roomTurnTimers.get(roomIdStr);
  if (timer) {
    clearTimeout(timer);
    roomTurnTimers.delete(roomIdStr);
  }
}

/** Init board helper */
function initBoard(size = 20) {
  return Array(size).fill(null).map(() => Array(size).fill(null));
}

/** Lấy game state của phòng */
function getGameState(roomId) {
  if (!roomGames[roomId]) {
    roomGames[roomId] = { 
      board: initBoard(), 
      turn: "X", 
      history: [],
      currentPlayerIndex: 0
    };
  }
  return roomGames[roomId];
}

/** ----------------- MAKE MOVE ----------------- */
async function handleMakeMove(io, socket, data) {
  const { roomId, x, y } = data;
  const userId = socket.user._id;
  const username = socket.user.username;
  const nickname = socket.user.nickname || socket.user.username;
  const roomIdStr = roomId.toString();

  log("make_move", { roomId: roomIdStr, userId, username, x, y });

  try {
    // 1️⃣ Kiểm tra phòng tồn tại và đang chơi
    const room = await RoomService.getRoomById(roomIdStr);
    if (!room) {
      socket.emit("move_error", { message: "Phòng không tồn tại" });
      return;
    }

    if (room.status !== "playing") {
      socket.emit("move_error", { message: "Game chưa bắt đầu hoặc đã kết thúc" });
      return;
    }

    // 2️⃣ Kiểm tra người chơi có trong phòng không
    const player = room.players.find(p => p.userId.toString() === userId.toString());
    if (!player) {
      socket.emit("move_error", { message: "Bạn không ở trong phòng này" });
      return;
    }

    // 3️⃣ Lấy game state
    const game = getGameState(roomIdStr);

    // 4️⃣ Kiểm tra lượt chơi
    const currentPlayer = room.players[game.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.userId.toString() !== userId.toString()) {
      const currentPlayerNickname = currentPlayer ? (currentPlayer.nickname || currentPlayer.username) : "Unknown";
      socket.emit("move_error", { 
        message: "Chưa đến lượt bạn",
        currentPlayer: currentPlayerNickname
      });
      return;
    }

    // 5️⃣ Kiểm tra vị trí hợp lệ
    if (x < 0 || x >= game.board.length || y < 0 || y >= game.board[0].length) {
      socket.emit("move_error", { message: "Vị trí không hợp lệ" });
      return;
    }

    if (game.board[x][y] !== null) {
      socket.emit("move_error", { message: "Vị trí này đã có cờ" });
      return;
    }

    // 6️⃣ Đánh cờ
    const mark = game.turn;
    game.board[x][y] = mark;
    game.history.push({ x, y, mark, userId, username, nickname, timestamp: new Date().toISOString() });

    // 7️⃣ Kiểm tra thắng
    const isWinner = checkWinner(game.board, x, y);
    let gameResult = null;

    // 8️⃣ Kiểm tra hòa (bàn cờ đầy)
    const isDraw = game.board.every(row => row.every(cell => cell !== null));

    // 🔟 Thông báo nước đi cho tất cả user trong phòng TRƯỚC khi thông báo kết quả
    // Đảm bảo cả 2 người chơi đều thấy nước đi cuối cùng
    const turnTimeLimitForMove = room.turnTimeLimit || 30;
    const lastMove = {
      x,
      y,
      mark,
      userId,
      username,
      board: game.board,
      turn: isWinner || isDraw ? mark : (game.turn === "X" ? "O" : "X"),
      currentPlayer: isWinner || isDraw ? null : room.players[(game.currentPlayerIndex + 1) % room.players.length],
      currentPlayerIndex: isWinner || isDraw ? game.currentPlayerIndex : (game.currentPlayerIndex + 1) % room.players.length,
      history: game.history,
      lastMove: { x, y, mark, userId, username, nickname },
      message: `${nickname} đã đánh tại (${x}, ${y})`,
      timestamp: new Date().toISOString(),
      turnTimeLimit: turnTimeLimitForMove
    };

    io.to(roomIdStr).emit("move_made", lastMove);

    // Đợi một chút để đảm bảo client nhận được move_made trước
    await new Promise(resolve => setTimeout(resolve, 100));

    if (isWinner) {
      // Có người thắng
      gameResult = {
        winner: userId,
        winnerUsername: username,
        winnerNickname: nickname,
        winnerMark: mark,
        message: `${nickname} thắng!`,
        winningMove: { x, y }
      };

      // Cập nhật trạng thái phòng
      await RoomService.endGame({ 
        roomId: roomIdStr, 
        result: gameResult 
      });

      // Cập nhật gameStats cho người thắng và thua
      try {
        const loser = room.players.find(p => p.userId.toString() !== userId.toString());
        const loserNickname = loser?.nickname || loser?.username || "Đối thủ";
        if (userId) {
          await UserService.updateGameStats(userId, "caro", true, false);
        }
        if (loser?.userId) {
          await UserService.updateGameStats(loser.userId, "caro", false, false);
        }
        // Cập nhật gameResult với nickname
        gameResult.winnerNickname = nickname;
        gameResult.loserNickname = loserNickname;
      } catch (statsError) {
        log("updateGameStats error", statsError.message);
        // Không block game end nếu update stats lỗi
      }

      // Thông báo kết quả cho tất cả user trong phòng
      io.to(roomIdStr).emit("game_end", {
        result: gameResult,
        board: game.board,
        lastMove: { x, y, mark, userId, username, nickname },
        message: `${nickname} thắng!`,
        timestamp: new Date().toISOString()
      });

      // Cập nhật trạng thái phòng
      const roomAfter = await RoomService.getRoomById(roomIdStr);
      io.to(roomIdStr).emit("room_update", {
        room: roomAfter,
        message: "Game đã kết thúc",
        timestamp: new Date().toISOString()
      });

      // Cập nhật status = 'online' cho tất cả players
      await updatePlayersStatusToOnline(roomIdStr);

      // Dừng turn timer
      stopTurnTimer(roomIdStr);

      // Cleanup ping tracking cho tất cả players
      const { cleanupAllPingTracking } = require("./room.socket");
      cleanupAllPingTracking(roomIdStr);

      // KHÔNG xóa game state ngay, để có thể clear board sau
      // delete roomGames[roomIdStr];

      log("Game ended - winner", { roomId: roomIdStr, winner: username });
      return;
    }

    if (isDraw) {
      gameResult = {
        winner: null,
        message: "Hòa!"
      };

      await RoomService.endGame({ 
        roomId: roomIdStr, 
        result: gameResult 
      });

      // Cập nhật gameStats cho cả 2 người chơi (hòa)
      try {
        for (const player of room.players) {
          if (player.userId) {
            await UserService.updateGameStats(player.userId, "caro", false, true);
          }
        }
      } catch (statsError) {
        log("updateGameStats error", statsError.message);
        // Không block game end nếu update stats lỗi
      }

      io.to(roomIdStr).emit("game_end", {
        result: gameResult,
        board: game.board,
        lastMove: { x, y, mark, userId, username, nickname },
        message: "Hòa!",
        timestamp: new Date().toISOString()
      });

      const roomAfter = await RoomService.getRoomById(roomIdStr);
      io.to(roomIdStr).emit("room_update", {
        room: roomAfter,
        message: "Game đã kết thúc (Hòa)",
        timestamp: new Date().toISOString()
      });

      // Cập nhật status = 'online' cho tất cả players
      await updatePlayersStatusToOnline(roomIdStr);

      // Dừng turn timer
      stopTurnTimer(roomIdStr);

      // Cleanup ping tracking cho tất cả players
      const { cleanupAllPingTracking } = require("./room.socket");
      cleanupAllPingTracking(roomIdStr);

      // KHÔNG xóa game state ngay, để có thể clear board sau
      // delete roomGames[roomIdStr];

      log("Game ended - draw", { roomId: roomIdStr });
      return;
    }

    // 9️⃣ Đổi lượt (nếu không thắng và không hòa)
    // Dừng timer của lượt hiện tại
    stopTurnTimer(roomIdStr);
    
    // Cập nhật turn và turnStartTime TRƯỚC khi emit move_made để client có thể tính toán đúng
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % room.players.length;
    game.turn = game.turn === "X" ? "O" : "X";
    const turnTimeLimit = room.turnTimeLimit || 30;
    game.turnStartTime = Date.now();

    // Bắt đầu timer cho lượt mới
    startTurnTimer(io, roomIdStr, turnTimeLimit);
    
    // Emit lại move_made với turnStartTime để client đồng bộ timer
    const turnStartTime = game.turnStartTime;
    io.to(roomIdStr).emit("turn_started", {
      turnStartTime: turnStartTime,
      turnTimeLimit: turnTimeLimit,
      currentPlayerIndex: game.currentPlayerIndex,
      turn: game.turn,
      timestamp: new Date().toISOString()
    });

    log("Move made successfully", { roomId: roomIdStr, x, y, mark, nextTurn: game.turn });

  } catch (err) {
    log("make_move error", err.message);
    socket.emit("move_error", { message: err.message });
  }
}

/** ----------------- UNDO MOVE (chỉ vs Bot hoặc khi được phép) ----------------- */
async function handleUndoMove(io, socket, data) {
  const { roomId } = data;
  const userId = socket.user._id;
  const username = socket.user.username;
  const nickname = socket.user.nickname || socket.user.username;
  const roomIdStr = roomId.toString();

  log("undo_move", { roomId: roomIdStr, userId, username, nickname });

  try {
    const room = await RoomService.getRoomById(roomIdStr);
    if (!room) {
      socket.emit("undo_error", { message: "Phòng không tồn tại" });
      return;
    }

    if (room.status !== "playing") {
      socket.emit("undo_error", { message: "Game chưa bắt đầu hoặc đã kết thúc" });
      return;
    }

    const game = roomGames[roomIdStr];
    if (!game || game.history.length === 0) {
      socket.emit("undo_error", { message: "Không có nước đi để hoàn tác" });
      return;
    }

    // Kiểm tra quyền: chỉ cho phép undo nước đi của chính mình hoặc nếu là host
    const isHost = room.hostId?.toString() === userId.toString();
    const lastMove = game.history[game.history.length - 1];
    
    // Nếu không phải host và nước đi cuối không phải của mình, không cho phép
    if (!isHost && lastMove.userId.toString() !== userId.toString()) {
      socket.emit("undo_error", { message: "Bạn chỉ có thể hoàn tác nước đi của chính mình" });
      return;
    }

    // Xóa nước đi cuối (hoặc 2 nước nếu vs Bot)
    const movesToUndo = room.players.length === 1 ? 2 : 1; // Nếu 1 player (vs Bot) thì undo 2 nước
    
    if (game.history.length < movesToUndo) {
      socket.emit("undo_error", { message: "Không đủ nước đi để hoàn tác" });
      return;
    }

    const undoneMoves = [];
    for (let i = 0; i < movesToUndo; i++) {
      const move = game.history.pop();
      undoneMoves.push(move);
      game.board[move.x][move.y] = null;
    }

    // Đổi lại lượt
    game.currentPlayerIndex = (game.currentPlayerIndex - movesToUndo + room.players.length) % room.players.length;
    game.turn = game.turn === "X" ? "O" : "X";

    // Thông báo cho tất cả user trong phòng
    io.to(roomIdStr).emit("move_undone", {
      board: game.board,
      turn: game.turn,
      currentPlayer: room.players[game.currentPlayerIndex],
      currentPlayerIndex: game.currentPlayerIndex,
      undoneMoves: undoneMoves,
      history: game.history,
      message: `${nickname} đã hoàn tác ${movesToUndo} nước đi`,
      timestamp: new Date().toISOString()
    });

    log("Move undone", { roomId: roomIdStr, movesUndone: movesToUndo });

  } catch (err) {
    log("undo_move error", err.message);
    socket.emit("undo_error", { message: err.message });
  }
}

/** ----------------- RESET GAME (chỉ owner) ----------------- */
async function handleResetGame(io, socket, data) {
  const { roomId } = data;
  const userId = socket.user._id;
  const username = socket.user.username;
  const nickname = socket.user.nickname || socket.user.username;
  const roomIdStr = roomId.toString();

  log("reset_game", { roomId: roomIdStr, userId, username, nickname });

  try {
    const room = await RoomService.getRoomById(roomIdStr);
    if (!room) {
      socket.emit("reset_error", { message: "Phòng không tồn tại" });
      return;
    }

    if (room.hostId?.toString() !== userId.toString()) {
      socket.emit("reset_error", { message: "Chỉ chủ phòng mới có thể reset game" });
      return;
    }

    // Reset game state
    roomGames[roomIdStr] = { 
      board: initBoard(), 
      turn: "X", 
      history: [],
      currentPlayerIndex: 0
    };

    // Cập nhật trạng thái phòng về waiting và reset ready status
    const updatedPlayers = room.players.map(p => ({ ...p, isReady: false }));
    await RoomService.updateRoom(roomIdStr, { 
      status: "waiting",
      players: updatedPlayers
    });
    const roomAfter = await RoomService.getRoomById(roomIdStr);

    // Thông báo cho tất cả user trong phòng
    io.to(roomIdStr).emit("game_reset", {
      board: roomGames[roomIdStr].board,
      turn: "X",
      currentPlayerIndex: 0,
      currentPlayer: roomAfter.players[0],
      room: roomAfter,
      message: `${nickname} đã reset game`,
      timestamp: new Date().toISOString()
    });

    io.to(roomIdStr).emit("room_update", {
      room: roomAfter,
      message: "Game đã được reset",
      timestamp: new Date().toISOString()
    });

    log("Game reset", { roomId: roomIdStr });

  } catch (err) {
    log("reset_game error", err.message);
    socket.emit("reset_error", { message: err.message });
  }
}

/** ----------------- INIT GAME (khi game start) ----------------- */
async function initGameForRoom(roomId, players) {
  const roomIdStr = roomId.toString();
  const RoomService = require("../services/room.service");
  const Room = require("../models/room.model");
  
  try {
    // Lấy room mới nhất từ DB để đảm bảo có playerMarks và firstTurn mới nhất
    const room = await Room.findById(roomIdStr).lean();
    if (!room) {
      throw new Error("Room not found");
    }
    
    let playerMarksObj = {};
    
    // Luôn sử dụng playerMarks từ room (nếu có)
    if (room.playerMarks) {
      if (room.playerMarks instanceof Map) {
        playerMarksObj = Object.fromEntries(room.playerMarks);
      } else if (typeof room.playerMarks === 'object') {
        playerMarksObj = room.playerMarks;
      }
      log("Using playerMarks from room", playerMarksObj);
    }
    
    // Nếu chưa có playerMarks hoặc không đủ, gán mặc định
    const marksCount = Object.keys(playerMarksObj).filter(key => playerMarksObj[key] === 'X' || playerMarksObj[key] === 'O').length;
    if (marksCount < 2) {
      // Nếu chưa có, gán mặc định: chủ phòng là X, player thứ 2 là O
      if (players && players.length >= 2) {
        const player1Id = players[0]?.userId?.toString();
        const player2Id = players[1]?.userId?.toString();
        
        if (player1Id && player2Id) {
          // Tìm chủ phòng
          const hostPlayer = players.find(p => p.isHost);
          const nonHostPlayer = players.find(p => !p.isHost);
          
          if (hostPlayer && nonHostPlayer) {
            playerMarksObj[hostPlayer.userId.toString()] = "X";
            playerMarksObj[nonHostPlayer.userId.toString()] = "O";
          } else {
            // Fallback: player đầu tiên là X, player thứ 2 là O
            playerMarksObj[player1Id] = "X";
            playerMarksObj[player2Id] = "O";
          }
          
          // Lưu playerMarks vào Room
          try {
            await Room.findByIdAndUpdate(roomIdStr, {
              playerMarks: playerMarksObj
            });
            log("Saved default playerMarks to room", playerMarksObj);
          } catch (dbError) {
            log("Error saving playerMarks to DB", dbError.message);
          }
        } else {
          log("Warning: Cannot assign marks - missing player IDs", { players });
        }
      }
    }
    
    // Lấy firstTurn từ room (mặc định là X) - đảm bảo lấy từ DB
    const firstTurn = (room && room.firstTurn) ? room.firstTurn : 'X';
    log("Using firstTurn from room", { firstTurn, roomFirstTurn: room?.firstTurn, playerMarksObj });
    
    // Xác định currentPlayerIndex dựa trên firstTurn
    let currentPlayerIndex = 0;
    if (players && players.length >= 2 && Object.keys(playerMarksObj).length > 0) {
      // Tìm player có mark = firstTurn
      const firstTurnPlayerIndex = players.findIndex(p => {
        const playerId = p.userId?.toString();
        return playerMarksObj[playerId] === firstTurn;
      });
      
      if (firstTurnPlayerIndex !== -1) {
        currentPlayerIndex = firstTurnPlayerIndex;
        log("Found firstTurn player", { firstTurn, playerIndex: firstTurnPlayerIndex, playerId: players[firstTurnPlayerIndex]?.userId?.toString() });
      } else {
        log("Warning: Could not find player with firstTurn mark", { firstTurn, playerMarksObj, players: players.map(p => ({ userId: p.userId?.toString(), isHost: p.isHost })) });
      }
    }
    
    roomGames[roomIdStr] = { 
      board: initBoard(), 
      turn: firstTurn, 
      history: [],
      currentPlayerIndex: currentPlayerIndex,
      turnStartTime: Date.now(), // Thời gian bắt đầu lượt hiện tại
      turnTimer: null // Timer cho lượt hiện tại
    };
    return roomGames[roomIdStr];
  } catch (err) {
    log("initGameForRoom error", err.message);
    throw err; // Re-throw để handleStartGame có thể catch
  }
}

/** ----------------- GET GAME STATE ----------------- */
async function handleGetGameState(io, socket, data) {
  const { roomId } = data;
  const roomIdStr = roomId.toString();

  try {
    const room = await RoomService.getRoomById(roomIdStr);
    if (!room) {
      socket.emit("game_state_error", { message: "Phòng không tồn tại" });
      return;
    }

    const game = getGameState(roomIdStr);
    socket.emit("game_state", {
      board: game.board,
      turn: game.turn,
      history: game.history,
      currentPlayer: room.players[game.currentPlayerIndex],
      currentPlayerIndex: game.currentPlayerIndex,
      players: room.players,
      room: room,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    log("get_game_state error", err.message);
    socket.emit("game_state_error", { message: err.message });
  }
}

/** ----------------- DISCONNECT ----------------- */
async function handleDisconnect(io, socket) {
  const roomIdStr = socketToRoom.get(socket.id);
  if (roomIdStr) {
    socketToRoom.delete(socket.id);
    // Không xóa game state khi disconnect, để có thể reconnect
  }
}

/** ----------------- REQUEST DRAW (Xin hòa) ----------------- */
// Lưu trữ các yêu cầu xin hòa đang chờ: roomId -> { requesterId, timestamp }
const pendingDrawRequests = {};

async function handleRequestDraw(io, socket, data) {
  const { roomId } = data;
  const userId = socket.user._id;
  const username = socket.user.username;
  const nickname = socket.user.nickname || socket.user.username;
  const roomIdStr = roomId.toString();

  log("request_draw", { roomId: roomIdStr, userId, username });

  try {
    const room = await RoomService.getRoomById(roomIdStr);
    if (!room) {
      socket.emit("draw_error", { message: "Phòng không tồn tại" });
      return;
    }

    if (room.status !== "playing") {
      socket.emit("draw_error", { message: "Game chưa bắt đầu hoặc đã kết thúc" });
      return;
    }

    const player = room.players.find(p => p.userId.toString() === userId.toString());
    if (!player) {
      socket.emit("draw_error", { message: "Bạn không ở trong phòng này" });
      return;
    }

    // Tìm người chơi còn lại
    const opponent = room.players.find(p => p.userId.toString() !== userId.toString());
    if (!opponent) {
      socket.emit("draw_error", { message: "Không tìm thấy đối thủ" });
      return;
    }

    // Lưu yêu cầu xin hòa
    pendingDrawRequests[roomIdStr] = {
      requesterId: userId,
      requesterUsername: username,
      requesterNickname: nickname,
      timestamp: new Date().toISOString()
    };

    // Thông báo cho tất cả người chơi trong phòng
    // Frontend sẽ xử lý logic: nếu là người gửi thì hiển thị thông báo, nếu là đối thủ thì hiển thị dialog xác nhận
    io.to(roomIdStr).emit("draw_requested", {
      requesterId: userId,
      requesterUsername: username,
      requesterNickname: nickname,
      message: `${nickname} muốn xin hòa`,
      timestamp: new Date().toISOString()
    });

    log("Draw request sent", { roomId: roomIdStr, requester: username });

  } catch (err) {
    log("request_draw error", err.message);
    socket.emit("draw_error", { message: err.message });
  }
}

/** ----------------- CANCEL DRAW (Hủy yêu cầu xin hòa) ----------------- */
async function handleCancelDraw(io, socket, data) {
  const { roomId } = data;
  const userId = socket.user._id;
  const username = socket.user.username;
  const nickname = socket.user.nickname || socket.user.username;
  const roomIdStr = roomId.toString();

  log("cancel_draw", { roomId: roomIdStr, userId, username, nickname });

  try {
    const room = await RoomService.getRoomById(roomIdStr);
    if (!room) {
      socket.emit("draw_error", { message: "Phòng không tồn tại" });
      return;
    }

    const drawRequest = pendingDrawRequests[roomIdStr];
    if (!drawRequest) {
      socket.emit("draw_error", { message: "Không có yêu cầu xin hòa nào đang chờ" });
      return;
    }

    // Chỉ người gửi yêu cầu mới có thể hủy
    if (drawRequest.requesterId.toString() !== userId.toString()) {
      socket.emit("draw_error", { message: "Bạn không thể hủy yêu cầu của người khác" });
      return;
    }

    // Xóa yêu cầu đang chờ
    delete pendingDrawRequests[roomIdStr];

    // Thông báo cho tất cả người chơi trong phòng
    io.to(roomIdStr).emit("draw_cancelled", {
      requesterId: userId,
      requesterUsername: username,
      requesterNickname: nickname,
      message: `${nickname} đã hủy yêu cầu xin hòa`,
      timestamp: new Date().toISOString()
    });

    log("Draw request cancelled", { roomId: roomIdStr, requester: username });

  } catch (err) {
    log("cancel_draw error", err.message);
    socket.emit("draw_error", { message: err.message });
  }
}

/** ----------------- ACCEPT/REJECT DRAW ----------------- */
async function handleRespondDraw(io, socket, data) {
  const { roomId, accept } = data;
  const userId = socket.user._id;
  const username = socket.user.username;
  const nickname = socket.user.nickname || socket.user.username;
  const roomIdStr = roomId.toString();

  log("respond_draw", { roomId: roomIdStr, userId, username, accept });

  try {
    const room = await RoomService.getRoomById(roomIdStr);
    if (!room) {
      socket.emit("draw_error", { message: "Phòng không tồn tại" });
      return;
    }

    if (room.status !== "playing") {
      socket.emit("draw_error", { message: "Game chưa bắt đầu hoặc đã kết thúc" });
      return;
    }

    const drawRequest = pendingDrawRequests[roomIdStr];
    if (!drawRequest) {
      socket.emit("draw_error", { message: "Không có yêu cầu xin hòa nào đang chờ" });
      return;
    }

    // Kiểm tra người phản hồi không phải là người gửi yêu cầu
    if (drawRequest.requesterId.toString() === userId.toString()) {
      socket.emit("draw_error", { message: "Bạn không thể phản hồi yêu cầu của chính mình" });
      return;
    }

    // Xóa yêu cầu đang chờ
    delete pendingDrawRequests[roomIdStr];

    if (accept) {
      // Chấp nhận hòa
      const gameResult = {
        winner: null,
        message: "Hòa! (Cả hai người chơi đồng ý)"
      };

      await RoomService.endGame({ 
        roomId: roomIdStr, 
        result: gameResult 
      });

      const game = roomGames[roomIdStr];
      const roomAfter = await RoomService.getRoomById(roomIdStr);

      // Thông báo cho tất cả user trong phòng
      io.to(roomIdStr).emit("draw_accepted", {
        message: `${nickname} đã chấp nhận xin hòa. Game kết thúc hòa!`,
        timestamp: new Date().toISOString()
      });

      io.to(roomIdStr).emit("game_end", {
        result: gameResult,
        board: game?.board || null,
        message: "Hòa! (Cả hai người chơi đồng ý)",
        timestamp: new Date().toISOString()
      });

      io.to(roomIdStr).emit("room_update", {
        room: roomAfter,
        message: "Game đã kết thúc (Hòa)",
        timestamp: new Date().toISOString()
      });

      // Cập nhật status = 'online' cho tất cả players
      await updatePlayersStatusToOnline(roomIdStr);

      // Xóa game state
      if (game) {
        delete roomGames[roomIdStr];
      }

      log("Draw accepted", { roomId: roomIdStr });
    } else {
      // Từ chối hòa
      io.to(roomIdStr).emit("draw_rejected", {
        rejectorId: userId,
        rejectorUsername: username,
        rejectorNickname: nickname,
        message: `${nickname} đã từ chối xin hòa`,
        timestamp: new Date().toISOString()
      });

      log("Draw rejected", { roomId: roomIdStr, rejector: username });
    }

  } catch (err) {
    log("respond_draw error", err.message);
    socket.emit("draw_error", { message: err.message });
  }
}


/** ----------------- SURRENDER GAME ----------------- */
async function handleSurrender(io, socket, data) {
  const { roomId } = data;
  const userId = socket.user._id;
  const username = socket.user.username;
  const nickname = socket.user.nickname || socket.user.username;
  const roomIdStr = roomId.toString();

  log("surrender_game", { roomId: roomIdStr, userId, username, nickname });

  try {
    const room = await RoomService.getRoomById(roomIdStr);
    if (!room) {
      socket.emit("surrender_error", { message: "Phòng không tồn tại" });
      return;
    }

    if (room.status !== "playing") {
      socket.emit("surrender_error", { message: "Game chưa bắt đầu hoặc đã kết thúc" });
      return;
    }

    const player = room.players.find(p => p.userId.toString() === userId.toString());
    if (!player) {
      socket.emit("surrender_error", { message: "Bạn không ở trong phòng này" });
      return;
    }

    // Tìm người chơi còn lại (người thắng)
    const winner = room.players.find(p => p.userId.toString() !== userId.toString());
    const winnerNickname = winner?.nickname || winner?.username || "Đối thủ";
    
    const gameResult = {
      winner: winner?.userId || null,
      winnerUsername: winner?.username || "Đối thủ",
      winnerNickname: winnerNickname,
      loser: userId,
      loserUsername: username,
      loserNickname: nickname,
      message: `${nickname} đã đầu hàng. ${winnerNickname} thắng!`,
      isSurrender: true
    };

    await RoomService.endGame({ 
      roomId: roomIdStr, 
      result: gameResult 
    });

    // Cập nhật gameStats cho người thắng và thua (đầu hàng)
    try {
      if (winner?.userId) {
        await UserService.updateGameStats(winner.userId, "caro", true, false);
      }
      if (userId) {
        await UserService.updateGameStats(userId, "caro", false, false);
      }
    } catch (statsError) {
      log("updateGameStats error", statsError.message);
      // Không block game end nếu update stats lỗi
    }

    const game = roomGames[roomIdStr];
    const roomAfter = await RoomService.getRoomById(roomIdStr);

    // Thông báo cho tất cả user trong phòng
    io.to(roomIdStr).emit("game_end", {
      result: gameResult,
      board: game?.board || null,
      message: `${nickname} đã đầu hàng. ${winnerNickname} thắng!`,
      timestamp: new Date().toISOString()
    });

    io.to(roomIdStr).emit("room_update", {
      room: roomAfter,
      message: "Game đã kết thúc",
      timestamp: new Date().toISOString()
    });

    // Cập nhật status = 'online' cho tất cả players
    await updatePlayersStatusToOnline(roomIdStr);

    // Dừng turn timer
    stopTurnTimer(roomIdStr);

    // Cleanup ping tracking cho tất cả players
    const { cleanupAllPingTracking } = require("./room.socket");
    cleanupAllPingTracking(roomIdStr);

    // Xóa game state
    if (game) {
      delete roomGames[roomIdStr];
    }

    log("Game ended - surrender", { roomId: roomIdStr, loser: username });

  } catch (err) {
    log("surrender_game error", err.message);
    socket.emit("surrender_error", { message: err.message });
  }
}

/** ----------------- EXPORT MODULE ----------------- */
function gameSocket(io, socket) {
  // Lưu mapping socket -> room khi join room (được gọi từ room.socket.js)
  socket.on("game:init", (data) => {
    const { roomId } = data;
    if (roomId) {
      socketToRoom.set(socket.id, roomId.toString());
    }
  });

  socket.on("make_move", (data) => handleMakeMove(io, socket, data));
  socket.on("request_draw", (data) => handleRequestDraw(io, socket, data));
  socket.on("respond_draw", (data) => handleRespondDraw(io, socket, data));
  socket.on("get_game_state", (data) => handleGetGameState(io, socket, data));
  socket.on("surrender_game", (data) => handleSurrender(io, socket, data));
}

// Export main function và helper functions
module.exports = gameSocket;
module.exports.getGameState = getGameState;
module.exports.initGameForRoom = initGameForRoom;
module.exports.startTurnTimer = startTurnTimer;
module.exports.stopTurnTimer = stopTurnTimer;
module.exports.roomGames = roomGames;
