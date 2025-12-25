# Chức Năng Phức Tạp Nhất: Xử Lý Nước Đi (Game Move Handling)

**Tác giả:** NXHinh - 2025-01-27 -- tạo với AI

---

## 📋 Tổng Quan

Chức năng **xử lý nước đi** (`handleMakeMove`) trong file `backend/src/sockets/game/move.js` là chức năng **PHỨC TẠP NHẤT** trong toàn bộ hệ thống. Đây là core logic của game Caro, xử lý mọi nước đi của người chơi với nhiều điều kiện kiểm tra, xử lý race condition, quản lý state, đồng bộ hóa và xử lý lỗi.

---

## 🔴 Tại Sao Đây Là Chức Năng Khó Nhất?

### 1. **Race Condition Prevention (Phòng Tránh Xung Đột Đồng Thời)**

Hệ thống sử dụng **lock mechanism** để đảm bảo chỉ một nước đi được xử lý tại một thời điểm cho mỗi phòng:

```12:34:backend/src/sockets/game/move.js
/** Map để lock việc xử lý move cho mỗi phòng - tránh race condition */
// Format: roomId -> boolean (true = đang xử lý move)
const roomMoveLocks = new Map();

// Kiểm tra và đặt khóa để tránh xử lý nhiều move cùng lúc
if (roomMoveLocks.get(roomIdStr)) {
  socket.emit("move_error", { message: "Đang xử lý nước đi khác, vui lòng đợi" });
  return;
}

// Đặt khóa để bắt đầu xử lý move
roomMoveLocks.set(roomIdStr, true);
```

**Vấn đề phức tạp:**
- Lock phải được giải phóng ở **TẤT CẢ** các trường hợp: thành công, lỗi, rollback
- Nếu quên giải phóng lock → game bị đóng băng
- Phải xử lý cả khi game kết thúc (thắng/hòa) và khi tiếp tục chơi

### 2. **Nhiều Bước Kiểm Tra Phức Tạp**

Mỗi nước đi phải trải qua **10+ bước kiểm tra** nghiêm ngặt:

#### Bước 1: Kiểm tra Lock (Race Condition)
#### Bước 2: Kiểm tra phòng tồn tại và trạng thái

```36:51:backend/src/sockets/game/move.js
// Bước 1: Kiểm tra phòng có tồn tại và đang trong trạng thái playing không
const room = await RoomService.getRoomById(roomIdStr);
if (!room) {
  roomMoveLocks.delete(roomIdStr);
  socket.emit("move_error", { message: "Phòng không tồn tại" });
  return;
}

if (room.status !== "playing") {
  roomMoveLocks.delete(roomIdStr);
  socket.emit("move_error", { message: "Game chưa bắt đầu hoặc đã kết thúc" });
  // Gửi trạng thái game để client đồng bộ
  const game = getGameState(roomIdStr);
  emitGameStateSync(io, roomIdStr, room, game, "Game chưa bắt đầu hoặc đã kết thúc");
  return;
}
```

#### Bước 3: Kiểm tra người chơi có trong phòng

```53:59:backend/src/sockets/game/move.js
// Bước 2: Kiểm tra người chơi có trong phòng không
const player = room.players.find(p => p.userId.toString() === userId.toString());
if (!player) {
  roomMoveLocks.delete(roomIdStr);
  socket.emit("move_error", { message: "Bạn không ở trong phòng này" });
  return;
}
```

#### Bước 4: Kiểm tra đúng lượt chơi

```64:76:backend/src/sockets/game/move.js
// Bước 4: Kiểm tra có đúng lượt của người chơi này không
const currentPlayer = room.players[game.currentPlayerIndex];
if (!currentPlayer || currentPlayer.userId.toString() !== userId.toString()) {
  roomMoveLocks.delete(roomIdStr);
  const currentPlayerNickname = currentPlayer ? (currentPlayer.nickname || currentPlayer.username) : "Unknown";
  socket.emit("move_error", { 
    message: "Chưa đến lượt bạn",
    currentPlayer: currentPlayerNickname
  });
  // Gửi trạng thái game để client biết lượt hiện tại
  emitGameStateSync(io, roomIdStr, room, game, "Chưa đến lượt bạn");
  return;
}
```

#### Bước 5: Kiểm tra vị trí hợp lệ và chưa có cờ

```78:94:backend/src/sockets/game/move.js
// Bước 5: Kiểm tra vị trí (x, y) có hợp lệ không
if (x < 0 || x >= game.board.length || y < 0 || y >= game.board[0].length) {
  roomMoveLocks.delete(roomIdStr);
  socket.emit("move_error", { message: "Vị trí không hợp lệ" });
  // Gửi trạng thái game để đồng bộ
  emitGameStateSync(io, roomIdStr, room, game);
  return;
}

// Kiểm tra vị trí đã có cờ chưa
if (game.board[x][y] !== null) {
  roomMoveLocks.delete(roomIdStr);
  socket.emit("move_error", { message: "Vị trí này đã có cờ" });
  // Gửi trạng thái game để đồng bộ
  emitGameStateSync(io, roomIdStr, room, game);
  return;
}
```

**Mỗi bước kiểm tra** đều phải:
- Giải phóng lock nếu fail
- Emit error về client
- Đồng bộ state nếu cần thiết
- Return để dừng xử lý

### 3. **Rollback Mechanism (Cơ Chế Hoàn Tác)**

Khi có lỗi xảy ra trong quá trình xử lý (đặc biệt khi kiểm tra thắng), hệ thống phải **rollback** lại trạng thái cũ:

```96:120:backend/src/sockets/game/move.js
// Bước 6: Đánh cờ (lưu trạng thái cũ để có thể rollback nếu có lỗi)
const mark = game.turn;
const previousBoardState = JSON.parse(JSON.stringify(game.board));
const previousHistoryLength = game.history.length;

// Cập nhật bàn cờ và lịch sử
game.board[x][y] = mark;
game.history.push({ x, y, mark, userId, username, nickname, timestamp: new Date().toISOString() });

// Bước 7: Kiểm tra người chơi có thắng không
let isWinner = false;
let gameResult = null;

try {
  isWinner = checkWinner(game.board, x, y);
} catch (checkError) {
  // Nếu có lỗi khi kiểm tra thắng, rollback lại trạng thái cũ
  log("Error checking winner, rolling back", checkError.message);
  game.board = previousBoardState;
  game.history = game.history.slice(0, previousHistoryLength);
  roomMoveLocks.delete(roomIdStr);
  socket.emit("move_error", { message: "Lỗi khi kiểm tra thắng thua" });
  emitGameStateSync(io, roomIdStr, room, game);
  return;
}
```

**Độ phức tạp:**
- Phải lưu **deep copy** của board và history trước khi thay đổi
- Phải rollback **chính xác** cả board và history
- Phải giải phóng lock và đồng bộ state sau rollback

### 4. **Xử Lý 3 Trường Hợp Kết Thúc Game**

Sau khi đánh cờ, hệ thống phải xử lý **3 trường hợp** khác nhau:

#### Trường hợp 1: Có Người Thắng

```150:256:backend/src/sockets/game/move.js
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

  // Tìm người thua TRƯỚC KHI gọi endGame (vì room có thể thay đổi sau đó)
  const loser = room.players.find(p => p.userId.toString() !== userId.toString());
  const loserNickname = loser?.nickname || loser?.username || "Đối thủ";
  const loserUserId = loser?.userId ? loser.userId.toString() : null;
  
  // Cập nhật trạng thái phòng
  await RoomService.endGame({ 
    roomId: roomIdStr, 
    result: gameResult 
  });

  // Cập nhật gameStats cho người thắng và thua - tách riêng để đảm bảo cả 2 đều được cập nhật
  if (userId) {
    try {
      log("Updating winner stats", { winnerId: userId.toString() });
      await UserService.updateGameStats(userId, "caro", true, false);
      log("Winner stats updated successfully");
    } catch (statsError) {
      log("updateGameStats error for winner", statsError.message);
      log("updateGameStats error stack", statsError.stack);
    }
  }
  if (loserUserId) {
    try {
      log("Updating loser stats", { loserId: loserUserId });
      await UserService.updateGameStats(loserUserId, "caro", false, false);
      log("Loser stats updated successfully");
    } catch (statsError) {
      log("updateGameStats error for loser", statsError.message);
      log("updateGameStats error stack", statsError.stack);
    }
  } else {
    log("WARNING: loserUserId is null/undefined, cannot update loser stats");
    log("Room players:", room.players.map(p => ({ userId: p.userId?.toString(), username: p.username })));
  }

  // Lưu lịch sử chơi vào database
  try {
    const boardSize = game.board.length;
    await GameCaroService.saveGameHistory({
      roomId: roomIdStr,
      gameState: game,
      result: gameResult,
      boardSize: boardSize,
      mode: 'P2P'
    });
    log("Game history saved successfully", { roomId: roomIdStr });
  } catch (historyError) {
    log("Error saving game history", historyError.message);
    // Không throw error để không ảnh hưởng đến flow chính
  }

  // Cập nhật gameResult với nickname
  gameResult.winnerNickname = nickname;
  gameResult.loserNickname = loserNickname;

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
  const { cleanupAllPingTracking } = require("../room");
  cleanupAllPingTracking(roomIdStr);

  // Giải phóng lock khi game kết thúc
  roomMoveLocks.delete(roomIdStr);

  log("Game ended - winner", { roomId: roomIdStr, winner: username });
  return;
}
```

**Độ phức tạp:**
- Phải tìm người thua **TRƯỚC KHI** gọi endGame
- Cập nhật game stats cho cả người thắng và thua (phải tách riêng để đảm bảo cả 2 đều được cập nhật)
- Lưu lịch sử game vào database
- Emit events để thông báo cho tất cả clients
- Cleanup: timer, ping tracking, lock
- Cập nhật status players

#### Trường hợp 2: Hòa (Bàn Cờ Đầy)

```259:327:backend/src/sockets/game/move.js
if (isDraw) {
  gameResult = {
    winner: null,
    message: "Hòa!"
  };

  await RoomService.endGame({ 
    roomId: roomIdStr, 
    result: gameResult 
  });

  // Cập nhật gameStats cho cả 2 người chơi (hòa) - tách riêng để đảm bảo cả 2 đều được cập nhật
  for (const player of room.players) {
    if (player.userId) {
      try {
        await UserService.updateGameStats(player.userId, "caro", false, true);
      } catch (statsError) {
        log(`updateGameStats error for player ${player.userId} on draw`, statsError.message);
      }
    }
  }

  // Lưu lịch sử chơi vào database
  try {
    const boardSize = game.board.length;
    await GameCaroService.saveGameHistory({
      roomId: roomIdStr,
      gameState: game,
      result: gameResult,
      boardSize: boardSize,
      mode: 'P2P'
    });
    log("Game history saved successfully (draw)", { roomId: roomIdStr });
  } catch (historyError) {
    log("Error saving game history (draw)", historyError.message);
    // Không throw error để không ảnh hưởng đến flow chính
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
  const { cleanupAllPingTracking } = require("../room");
  cleanupAllPingTracking(roomIdStr);

  // 🔓 Giải phóng lock khi game kết thúc
  roomMoveLocks.delete(roomIdStr);

  log("Game ended - draw", { roomId: roomIdStr });
  return;
}
```

**Độ phức tạp:**
- Cập nhật stats cho **TẤT CẢ** người chơi (hòa)
- Không có winner nên xử lý khác với trường hợp thắng

#### Trường hợp 3: Tiếp Tục Chơi (Đổi Lượt)

```329:356:backend/src/sockets/game/move.js
// Đổi lượt (nếu không thắng và không hòa)
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

// Giải phóng lock sau khi hoàn thành
roomMoveLocks.delete(roomIdStr);

log("Move made successfully", { roomId: roomIdStr, x, y, mark, nextTurn: game.turn });
```

**Độ phức tạp:**
- Phải dừng timer cũ trước khi bắt đầu timer mới
- Cập nhật turn và currentPlayerIndex
- Phải tính toán đúng thời gian bắt đầu lượt mới
- Emit event để client đồng bộ timer

### 5. **State Synchronization (Đồng Bộ Hóa Trạng Thái)**

Hệ thống phải đảm bảo **TẤT CẢ clients** trong phòng đều nhận được state mới nhất:

```125:148:backend/src/sockets/game/move.js
// Thông báo nước đi cho tất cả user trong phòng TRƯỚC khi thông báo kết quả
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
```

**Độ phức tạp:**
- Phải emit `move_made` **TRƯỚC** khi emit `game_end`
- Phải đợi một khoảng thời gian để đảm bảo client nhận được
- Phải tính toán đúng turn và currentPlayer cho event

### 6. **Error Handling (Xử Lý Lỗi)**

Hệ thống phải xử lý lỗi ở **mọi bước** và đảm bảo lock được giải phóng:

```357:377:backend/src/sockets/game/move.js
} catch (err) {
  log("make_move error", err.message);
  
  // Giải phóng lock khi có lỗi
  roomMoveLocks.delete(roomIdStr);
  
  // Cố gắng rollback nếu có thể
  try {
    const room = await RoomService.getRoomById(roomIdStr);
    if (room && room.status === "playing") {
      const game = getGameState(roomIdStr);
      // Emit game state để đồng bộ client
      emitGameStateSync(io, roomIdStr, room, game, "Đã xảy ra lỗi, vui lòng thử lại");
    }
  } catch (syncError) {
    log("Error syncing game state after error", syncError.message);
  }
  
  socket.emit("move_error", { message: err.message });
}
```

**Độ phức tạp:**
- Lock **PHẢI** được giải phóng trong catch block
- Phải cố gắng đồng bộ state nếu có thể
- Phải emit error về client để thông báo

### 7. **Database Operations (Thao Tác Database)**

Mỗi nước đi có thể trigger nhiều thao tác database:

1. **Cập nhật game stats** cho người chơi (thắng/thua/hòa)
2. **Lưu lịch sử game** vào database (khi kết thúc)
3. **Cập nhật trạng thái phòng** (endGame)
4. **Cập nhật status players** (online/offline)

**Độ phức tạp:**
- Phải xử lý lỗi database mà không làm crash game
- Phải đảm bảo stats được cập nhật cho **TẤT CẢ** người chơi
- Phải lưu lịch sử game với đầy đủ thông tin

### 8. **Timer Management (Quản Lý Timer)**

Hệ thống phải quản lý timer cho mỗi lượt chơi:

- Dừng timer của lượt cũ
- Bắt đầu timer cho lượt mới
- Tính toán đúng thời gian bắt đầu lượt
- Emit event để client đồng bộ timer

### 9. **Cleanup Operations (Thao Tác Dọn Dẹp)**

Sau mỗi nước đi (đặc biệt khi kết thúc game), hệ thống phải cleanup:

- Giải phóng lock
- Dừng turn timer
- Cleanup ping tracking
- Cập nhật status players

---

## 📊 Thống Kê Độ Phức Tạp

| Tiêu Chí | Giá Trị |
|----------|---------|
| Số dòng code | ~370 dòng |
| Số bước kiểm tra | 10+ bước |
| Số trường hợp xử lý | 3 trường hợp chính (thắng/hòa/tiếp tục) |
| Số database operations | 4+ operations |
| Số socket events | 5+ events |
| Số edge cases | 15+ edge cases |
| Độ phức tạp logic | ⭐⭐⭐⭐⭐ (5/5) |

---

## 🔍 Các Thách Thức Kỹ Thuật

### 1. **Race Condition**

**Vấn đề:** Nhiều clients có thể gửi move cùng lúc

**Giải pháp:** Sử dụng lock mechanism với Map

```javascript
const roomMoveLocks = new Map();
if (roomMoveLocks.get(roomIdStr)) {
  // Reject move
  return;
}
roomMoveLocks.set(roomIdStr, true);
// ... xử lý move
roomMoveLocks.delete(roomIdStr);
```

### 2. **State Consistency (Tính Nhất Quán Trạng Thái)**

**Vấn đề:** Phải đảm bảo state nhất quán giữa server và clients

**Giải pháp:**
- Lưu deep copy trước khi thay đổi (để rollback)
- Emit state sync khi có lỗi
- Đợi một khoảng thời gian trước khi emit event tiếp theo

### 3. **Error Recovery (Khôi Phục Lỗi)**

**Vấn đề:** Khi có lỗi, phải rollback và đồng bộ lại state

**Giải pháp:**
- Lưu previous state trước khi thay đổi
- Rollback khi có lỗi
- Emit game_state_sync để client đồng bộ lại

### 4. **Timer Synchronization (Đồng Bộ Timer)**

**Vấn đề:** Phải đảm bảo timer giữa server và client đồng bộ

**Giải pháp:**
- Server gửi `turnStartTime` (timestamp) cho client
- Client tính toán remaining time dựa trên elapsed time
- Server bắt đầu timer mới và emit event

---

## 🎯 Flow Diagram (Sơ Đồ Luồng Xử Lý)

```
1. Client gửi make_move (x, y)
   ↓
2. Server kiểm tra lock
   ├─ Nếu đang lock → Reject
   └─ Nếu không lock → Set lock
   ↓
3. Kiểm tra phòng tồn tại và status = "playing"
   ├─ Fail → Release lock, emit error, return
   └─ Pass → Tiếp tục
   ↓
4. Kiểm tra người chơi có trong phòng
   ├─ Fail → Release lock, emit error, return
   └─ Pass → Tiếp tục
   ↓
5. Kiểm tra đúng lượt chơi
   ├─ Fail → Release lock, emit error, sync state, return
   └─ Pass → Tiếp tục
   ↓
6. Kiểm tra vị trí hợp lệ và chưa có cờ
   ├─ Fail → Release lock, emit error, sync state, return
   └─ Pass → Tiếp tục
   ↓
7. Lưu previous state (để rollback nếu cần)
   ↓
8. Cập nhật board và history
   ↓
9. Kiểm tra thắng
   ├─ Error → Rollback, release lock, emit error, sync state, return
   ├─ Thắng → Xử lý thắng (10a)
   ├─ Hòa → Xử lý hòa (10b)
   └─ Tiếp tục → Xử lý đổi lượt (10c)
   ↓
10a. XỬ LÝ THẮNG:
   - Tạo gameResult
   - End game
   - Cập nhật stats (thắng/thua)
   - Lưu lịch sử game
   - Emit game_end
   - Cleanup (timer, ping, lock)
   - Return

10b. XỬ LÝ HÒA:
   - Tạo gameResult (winner = null)
   - End game
   - Cập nhật stats (hòa cho tất cả)
   - Lưu lịch sử game
   - Emit game_end
   - Cleanup (timer, ping, lock)
   - Return

10c. XỬ LÝ ĐỔI LƯỢT:
   - Emit move_made
   - Đợi 100ms
   - Dừng timer cũ
   - Cập nhật turn và currentPlayerIndex
   - Bắt đầu timer mới
   - Emit turn_started
   - Release lock
   - Return
```

---

## ⚠️ Các Điểm Cần Lưu Ý

### 1. **Lock Phải Được Giải Phóng Ở MỌI Trường Hợp**

```javascript
// ❌ SAI: Quên release lock
if (error) {
  socket.emit("error");
  return; // Lock vẫn còn!
}

// ✅ ĐÚNG: Luôn release lock
if (error) {
  roomMoveLocks.delete(roomIdStr);
  socket.emit("error");
  return;
}
```

### 2. **Phải Lưu Previous State Trước Khi Thay Đổi**

```javascript
// ✅ ĐÚNG: Deep copy
const previousBoardState = JSON.parse(JSON.stringify(game.board));
const previousHistoryLength = game.history.length;

// Thay đổi state
game.board[x][y] = mark;

// Nếu có lỗi, rollback
game.board = previousBoardState;
game.history = game.history.slice(0, previousHistoryLength);
```

### 3. **Phải Tách Riêng Việc Cập Nhật Stats**

```javascript
// ✅ ĐÚNG: Tách riêng để đảm bảo cả 2 đều được cập nhật
if (winnerUserId) {
  try {
    await UserService.updateGameStats(winnerUserId, "caro", true, false);
  } catch (error) {
    log("Error updating winner stats", error);
  }
}

if (loserUserId) {
  try {
    await UserService.updateGameStats(loserUserId, "caro", false, false);
  } catch (error) {
    log("Error updating loser stats", error);
  }
}
```

### 4. **Phải Emit move_made TRƯỚC game_end**

```javascript
// ✅ ĐÚNG: Emit move_made trước
io.to(roomIdStr).emit("move_made", lastMove);
await new Promise(resolve => setTimeout(resolve, 100));
io.to(roomIdStr).emit("game_end", gameResult);
```

---

## 🚀 Kết Luận

Chức năng **xử lý nước đi** (`handleMakeMove`) là chức năng **PHỨC TẠP NHẤT** trong hệ thống vì:

1. ✅ Xử lý race condition với lock mechanism
2. ✅ 10+ bước kiểm tra nghiêm ngặt
3. ✅ 3 trường hợp xử lý khác nhau (thắng/hòa/tiếp tục)
4. ✅ Rollback mechanism khi có lỗi
5. ✅ State synchronization giữa nhiều clients
6. ✅ Nhiều database operations
7. ✅ Timer management
8. ✅ Error handling toàn diện
9. ✅ Cleanup operations

Đây là core logic của game, đòi hỏi sự cẩn thận và kỹ lưỡng trong từng dòng code để đảm bảo game hoạt động chính xác và ổn định.

---

**Tài liệu này giải thích chi tiết tại sao xử lý nước đi là chức năng phức tạp nhất trong hệ thống. Mọi thắc mắc vui lòng tham khảo code trong file `backend/src/sockets/game/move.js`.**

