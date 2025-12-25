# Giải Thích Chi Tiết: Chơi Game, Nhắn Tin và Reconnect

**Tác giả:** NXHinh - 2025-01-27 -- tạo với AI

---

## 📋 Mục Lục

1. [Phần Chơi Game](#phần-chơi-game)
2. [Hệ Thống Nhắn Tin](#hệ-thống-nhắn-tin)
3. [Reconnect Khi Chơi Game](#reconnect-khi-chơi-game)

---

## 🎮 Phần Chơi Game

### 1. Khởi Tạo Game

#### Backend: `backend/src/sockets/room/start.js`

Khi chủ phòng bắt đầu game, hệ thống thực hiện các bước sau:

```12:141:backend/src/sockets/room/start.js
// Xử lý khi chủ phòng bắt đầu game (chỉ chủ phòng mới có quyền)
async function handleStartGame(io, socket, data) {
  // 1. Kiểm tra quyền (chỉ chủ phòng)
  // 2. Kiểm tra trạng thái phòng (phải là "waiting")
  // 3. Kiểm tra số lượng người chơi (tối thiểu 2)
  // 4. Kiểm tra tất cả người chơi đã ready
  // 5. Cập nhật trạng thái phòng thành "playing"
  // 6. Khởi tạo game state (bàn cờ, lượt chơi, lịch sử)
  // 7. Khởi tạo ping tracking cho tất cả players
  // 8. Bắt đầu turn timer cho lượt đầu tiên
  // 9. Emit "game_start" cho tất cả client trong phòng
}
```

**Chi tiết khởi tạo game state:**

```46:142:backend/src/sockets/game/state.js
async function initGameForRoom(roomId, players) {
  // 1. Lấy room từ DB để có playerMarks và firstTurn
  // 2. Gán playerMarks (X/O) cho từng người chơi
  // 3. Xác định currentPlayerIndex dựa trên firstTurn
  // 4. Tạo bàn cờ 20x20 (mặc định)
  // 5. Khởi tạo game state với:
  //    - board: mảng 2D 20x20 (null = ô trống)
  //    - turn: "X" hoặc "O" (dựa trên firstTurn)
  //    - history: mảng lưu lịch sử các nước đi
  //    - currentPlayerIndex: chỉ số người chơi hiện tại
  //    - turnStartTime: thời gian bắt đầu lượt
}
```

### 2. Xử Lý Nước Đi (Make Move)

#### Backend: `backend/src/sockets/game/move.js`

**Flow xử lý một nước đi:**

```17:377:backend/src/sockets/game/move.js
async function handleMakeMove(io, socket, data) {
  // BƯỚC 1: Kiểm tra và đặt lock để tránh race condition
  // BƯỚC 2: Kiểm tra phòng có tồn tại và đang "playing"
  // BƯỚC 3: Kiểm tra người chơi có trong phòng
  // BƯỚC 4: Kiểm tra có đúng lượt của người chơi
  // BƯỚC 5: Kiểm tra vị trí (x, y) hợp lệ và chưa có cờ
  // BƯỚC 6: Đánh cờ (cập nhật board và history)
  // BƯỚC 7: Kiểm tra người chơi có thắng không
  // BƯỚC 8: Kiểm tra hòa (bàn cờ đầy)
  // BƯỚC 9: Emit "move_made" cho tất cả client
  // BƯỚC 10: Nếu thắng/hòa -> kết thúc game, ngược lại -> đổi lượt
}
```

**Chi tiết kiểm tra thắng:**

```4:40:backend/src/utils/checkWinner.js
function checkWinner(board, x, y) {
  // Kiểm tra 4 hướng: ngang, dọc, chéo xuống, chéo lên
  // Mỗi hướng đếm số lượng cờ liên tiếp
  // Nếu có >= 5 cờ liên tiếp -> thắng
}
```

**Xử lý khi có người thắng:**

```150:256:backend/src/sockets/game/move.js
if (isWinner) {
  // 1. Tạo gameResult với thông tin người thắng/thua
  // 2. Cập nhật trạng thái phòng (endGame)
  // 3. Cập nhật gameStats cho người thắng và thua
  // 4. Lưu lịch sử game vào database
  // 5. Emit "game_end" cho tất cả client
  // 6. Cập nhật status players thành "online"
  // 7. Dừng turn timer
  // 8. Cleanup ping tracking
}
```

**Xử lý khi hòa:**

```259:327:backend/src/sockets/game/move.js
if (isDraw) {
  // Tương tự như thắng nhưng:
  // - winner = null
  // - Cập nhật gameStats cho cả 2 người chơi (hòa)
}
```

**Đổi lượt (nếu không thắng/hòa):**

```329:355:backend/src/sockets/game/move.js
// 1. Dừng timer của lượt hiện tại
// 2. Cập nhật currentPlayerIndex và turn
// 3. Cập nhật turnStartTime
// 4. Bắt đầu timer cho lượt mới
// 5. Emit "turn_started" với thông tin timer
```

### 3. Turn Timer (Thời Gian Giới Hạn Mỗi Lượt)

#### Backend: `backend/src/sockets/game/timer.js`

**Cơ chế hoạt động:**

```14:126:backend/src/sockets/game/timer.js
function startTurnTimer(io, roomIdStr, turnTimeLimit) {
  // 1. Xóa timer cũ nếu có
  // 2. Tạo setTimeout với thời gian = turnTimeLimit (giây)
  // 3. Khi hết thời gian:
  //    - Tìm người chơi đang đến lượt (người bị hết thời gian)
  //    - Tìm người chơi còn lại (người thắng)
  //    - Tạo gameResult với isTimeout = true
  //    - Kết thúc game (tương tự như thắng)
  //    - Cập nhật gameStats
  //    - Emit "game_end" cho tất cả client
}
```

**Frontend đồng bộ timer:**

```54:89:frontend/src/hooks/useGameRoomPlaying.js
const startTurnTimer = useCallback((serverTurnStartTime, timeLimit) => {
  // 1. Tính elapsed time từ serverTurnStartTime
  // 2. Tính remaining time
  // 3. Cập nhật UI mỗi 100ms
  // 4. Khi remaining <= 0 -> dừng timer
}, []);
```

### 4. Các Tính Năng Khác

#### Undo Move (Hoàn Tác)

```379:454:backend/src/sockets/game/move.js
async function handleUndoMove(io, socket, data) {
  // 1. Kiểm tra quyền (chỉ host hoặc người đánh nước đó)
  // 2. Xóa nước đi cuối (hoặc 2 nước nếu vs Bot)
  // 3. Đổi lại lượt
  // 4. Emit "move_undone" cho tất cả client
}
```

#### Reset Game

```456:523:backend/src/sockets/game/move.js
async function handleResetGame(io, socket, data) {
  // 1. Chỉ chủ phòng mới có quyền
  // 2. Giải phóng move lock
  // 3. Dừng turn timer
  // 4. Reset game state về trạng thái ban đầu
  // 5. Cập nhật phòng về "waiting" và reset ready status
  // 6. Emit "game_reset" cho tất cả client
}
```

#### Surrender (Đầu Hàng)

```1:1:backend/src/sockets/game/surrender.js
// Xử lý khi người chơi đầu hàng
// Tương tự như thắng nhưng người đầu hàng là người thua
```

#### Draw Request (Xin Hòa)

```1:1:backend/src/sockets/game/draw.js
// 1. Người chơi gửi request_draw
// 2. Đối thủ nhận được draw_requested
// 3. Đối thủ có thể accept hoặc reject
// 4. Nếu accept -> game kết thúc hòa
```

### 5. Frontend: Xử Lý Game

#### Hook: `useGameRoomPlaying.js`

**Xử lý click vào ô cờ:**

```91:134:frontend/src/hooks/useGameRoomPlaying.js
const handleCellClick = useCallback((x, y) => {
  // 1. Kiểm tra game đã kết thúc chưa
  // 2. Kiểm tra đang xử lý move khác không
  // 3. Kiểm tra đã nhận game state chưa
  // 4. Kiểm tra ô đã có cờ chưa
  // 5. Gọi gameSocket.makeMove(roomId, x, y)
  // 6. Set isProcessingMove = true
}, []);
```

**Lắng nghe events:**

```186:408:frontend/src/hooks/useGameRoomPlaying.js
const setupPlayingListeners = useCallback((onGameStart, onGameEnd) => {
  // Lắng nghe các events:
  // - game_start: Khởi tạo game state
  // - move_made: Cập nhật board sau nước đi
  // - turn_started: Bắt đầu timer cho lượt mới
  // - game_state: Đồng bộ game state
  // - game_state_sync: Đồng bộ khi có lỗi
  // - draw_requested: Hiển thị modal xin hòa
  // - game_end: Xử lý kết thúc game
}, []);
```

---

## 💬 Hệ Thống Nhắn Tin

### 1. Kiến Trúc Tổng Quan

Hệ thống nhắn tin hỗ trợ 2 loại:
- **Chat trong phòng**: Tin nhắn công khai trong phòng game
- **Chat riêng tư**: Tin nhắn giữa 2 người dùng

### 2. Backend: `backend/src/sockets/chat.socket.js`

#### Gửi Tin Nhắn

```12:83:backend/src/sockets/chat.socket.js
socket.on("send_message", async ({ roomId, receiverId, message, type = 'text' }) => {
  // 1. Kiểm tra message không rỗng
  // 2. Nếu là chat trong phòng:
  //    - Kiểm tra user có trong phòng không
  // 3. Lưu tin nhắn vào database (ChatService.saveMessage)
  // 4. Format message data với thông tin sender
  // 5. Nếu roomId -> emit "message_received" cho tất cả trong phòng
  // 6. Nếu receiverId -> emit "message_received" cho người nhận và người gửi
});
```

**Cấu trúc message data:**

```49:64:backend/src/sockets/chat.socket.js
const messageData = {
  _id: savedMessage._id,
  message: savedMessage.message,
  type: savedMessage.type,
  senderId: savedMessage.senderId,
  sender: {
    _id: savedMessage.senderId._id,
    nickname: savedMessage.senderId.nickname,
    avatarUrl: savedMessage.senderId.avatarUrl,
  },
  roomId: roomIdStr || null,
  receiverId: receiverIdStr || null,
  isRead: false,
  createdAt: savedMessage.createdAt,
  timestamp: new Date(savedMessage.createdAt).getTime(),
};
```

#### Lấy Lịch Sử Chat Trong Phòng

```86:121:backend/src/sockets/chat.socket.js
socket.on("get_room_messages", async ({ roomId, limit = 50 }) => {
  // 1. Kiểm tra user có trong phòng không
  // 2. Lấy lịch sử chat từ database (ChatService.getRoomMessages)
  // 3. Đánh dấu tất cả tin nhắn là đã đọc
  // 4. Emit "room_messages" với danh sách messages
});
```

#### Lấy Lịch Sử Chat Riêng Tư

```124:169:backend/src/sockets/chat.socket.js
socket.on("get_private_messages", async ({ userId, limit = 50 }) => {
  // 1. Lấy lịch sử chat riêng giữa 2 người (ChatService.getPrivateMessages)
  // 2. Format dữ liệu với thông tin sender và receiver
  // 3. Emit "private_messages" với danh sách messages
});
```

### 3. Cơ Chế Phát Tán Tin Nhắn

**Chat trong phòng:**
- Sử dụng `io.to(roomIdStr).emit("message_received", messageData)`
- Tất cả người trong phòng đều nhận được

**Chat riêng tư:**
- Sử dụng `io.to(receiverIdStr).emit("message_received", messageData)`
- Chỉ người nhận nhận được (và người gửi nhận lại để xác nhận)

### 4. Lưu Trữ Database

Tin nhắn được lưu vào MongoDB thông qua `ChatService`:
- Model: `Message` (có `roomId` hoặc `receiverId`)
- Lưu thông tin: sender, receiver, message, type, timestamp, isRead

---

## 🔄 Reconnect Khi Chơi Game

### 1. Vấn Đề Cần Giải Quyết

Khi người chơi bị mất kết nối trong lúc chơi game, hệ thống cần:
- Giữ nguyên game state (không xóa bàn cờ)
- Cho phép người chơi kết nối lại và tiếp tục chơi
- Đồng bộ lại trạng thái game khi reconnect

### 2. Backend: `backend/src/sockets/room/reconnect.js`

#### Xử Lý Reconnect

```15:155:backend/src/sockets/room/reconnect.js
async function handleCheckAndReconnect(io, socket) {
  // 1. Tìm phòng mà user đang tham gia (RoomService.findRoomByUserId)
  // 2. Kiểm tra player có đang disconnected không
  // 3. Nếu đang disconnected:
  //    - Xóa timeout disconnect nếu có
  //    - Đánh dấu reconnected (RoomService.markPlayerReconnected)
  //    - Join lại socket room
  //    - Lấy game state nếu đang chơi
  //    - Khởi tạo lại ping tracking
  //    - Emit "reconnect_success" với room và gameState
  //    - Thông báo cho các user khác (player_reconnected)
  // 4. Nếu chưa disconnected:
  //    - Chỉ cần join lại socket room
  //    - Lấy game state nếu đang chơi
  //    - Emit "reconnect_check" với room và gameState
}
```

**Lấy game state khi reconnect:**

```66:86:backend/src/sockets/room/reconnect.js
if (roomAfter.status === "playing") {
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
```

### 3. Game State Được Giữ Nguyên

**Backend: `backend/src/sockets/game/state.js`**

Game state được lưu trong memory (Map `roomGames`):

```6:29:backend/src/sockets/game/state.js
const roomGames = {};

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
```

**Lưu ý:** Game state KHÔNG bị xóa khi disconnect:

```55:62:backend/src/sockets/game/index.js
async function handleDisconnect(io, socket) {
  const roomIdStr = socketToRoom.get(socket.id);
  if (roomIdStr) {
    socketToRoom.delete(socket.id);
    // Không xóa game state khi disconnect, để có thể reconnect
  }
}
```

### 4. Lấy Game State Từ Server

**Backend: `backend/src/sockets/game/index.js`**

```14:53:backend/src/sockets/game/index.js
async function handleGetGameState(io, socket, data) {
  // 1. Lấy room từ database
  // 2. Lấy game state từ memory
  // 3. Emit "game_state" với đầy đủ thông tin:
  //    - board: bàn cờ hiện tại
  //    - turn: lượt hiện tại
  //    - history: lịch sử các nước đi
  //    - currentPlayer: người chơi hiện tại
  //    - turnStartTime: thời gian bắt đầu lượt
  //    - turnTimeLimit: thời gian giới hạn
}
```

### 5. Frontend: Xử Lý Reconnect

**Khi client kết nối lại:**

1. Gọi `gameSocket.checkReconnect()` để kiểm tra
2. Nhận `reconnect_success` hoặc `reconnect_check` với:
   - `room`: thông tin phòng
   - `gameState`: trạng thái game (nếu đang chơi)
3. Cập nhật Redux store với room và game state
4. Nếu đang chơi, gọi `gameSocket.getGameState(roomId)` để lấy đầy đủ thông tin
5. Đồng bộ timer dựa trên `turnStartTime` và `turnTimeLimit`

**Xử lý trong hook:**

```263:291:frontend/src/hooks/useGameRoomPlaying.js
const handleGameState = (data) => {
  // 1. Cập nhật room trong Redux
  // 2. Cập nhật board, turn, history
  // 3. Set gameStateReceived = true
  // 4. Khởi động lại turn timer nếu đang chơi
};
```

### 6. Ping/Pong Mechanism

Để phát hiện disconnect và cho phép reconnect:

**Backend: `backend/src/sockets/room/ping.js`**

- Client gửi `ping_room` mỗi 10 giây
- Server phản hồi `room_pong` với `timeRemaining`
- Nếu không nhận được ping trong 30 giây -> đánh dấu `isDisconnected`
- Khi reconnect, khởi tạo lại ping tracking

**Frontend:**

```33:52:frontend/src/hooks/useGameRoomPlaying.js
const startPingInterval = useCallback(() => {
  pingIntervalRef.current = setInterval(() => {
    const isPlayingState = currentRoom?.status === ROOM_STATUS.PLAYING;
    if (isPlayingState && hasJoined && roomId) {
      gameSocket.pingRoom(roomId);
    }
  }, 10000); // Gửi ping mỗi 10 giây
}, [currentRoom, hasJoined, roomId]);
```

### 7. Flow Reconnect Hoàn Chỉnh

```
1. Client mất kết nối
   ↓
2. Server phát hiện không nhận được ping (sau 30s)
   ↓
3. Server đánh dấu player.isDisconnected = true
   ↓
4. Client kết nối lại
   ↓
5. Client gọi checkReconnect()
   ↓
6. Server tìm phòng của user
   ↓
7. Server kiểm tra isDisconnected
   ↓
8. Server đánh dấu reconnected và join lại socket room
   ↓
9. Server lấy game state từ memory
   ↓
10. Server emit reconnect_success với room + gameState
    ↓
11. Client nhận và cập nhật UI
    ↓
12. Client gọi getGameState() để lấy đầy đủ thông tin
    ↓
13. Client đồng bộ timer và tiếp tục chơi
```

---

## 🔑 Điểm Quan Trọng

### Game State Management
- Game state được lưu trong **memory** (Map `roomGames`)
- **KHÔNG** bị xóa khi disconnect
- Được khôi phục khi reconnect

### Race Condition Prevention
- Sử dụng `roomMoveLocks` để tránh xử lý nhiều move cùng lúc
- Lock được giải phóng sau khi xử lý xong hoặc có lỗi

### Timer Synchronization
- Server gửi `turnStartTime` (timestamp) cho client
- Client tính toán remaining time dựa trên elapsed time
- Đảm bảo đồng bộ giữa server và client

### Error Handling
- Mọi lỗi đều emit về client với message rõ ràng
- Game state được đồng bộ lại khi có lỗi (`game_state_sync`)
- Rollback được thực hiện nếu có lỗi khi kiểm tra thắng

---

**Tài liệu này giải thích chi tiết cách hệ thống xử lý chơi game, nhắn tin và reconnect. Mọi thắc mắc vui lòng tham khảo code trong các file tương ứng.**

