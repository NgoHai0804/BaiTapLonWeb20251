# Tài Liệu Socket.IO - Game Caro Online

## Tổng Quan

Hệ thống sử dụng **Socket.IO** để xử lý real-time communication giữa client và server. Socket.IO được tích hợp với Express server và sử dụng JWT authentication để xác thực người dùng.

---

## 1. Khởi Tạo Socket.IO

### 1.1. Cấu Hình Cơ Bản

**File:** `backend/src/sockets/index.js`

```javascript
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
```

**Đặc điểm:**
- CORS được bật cho tất cả origins (có thể tùy chỉnh trong production)
- Socket.IO server được gắn vào HTTP server

### 1.2. Authentication Middleware

**Cơ chế xác thực:**
- Token được gửi qua `socket.handshake.auth.token` hoặc `socket.handshake.headers["authorization"]`
- Token được verify bằng JWT_SECRET
- Nếu token hợp lệ, thông tin user được lưu vào `socket.user`:
  ```javascript
  socket.user = {
    _id: decoded.id || decoded._id,
    username: decoded.username,
    nickname: decoded.nickname || decoded.username,
  };
  ```

**Lỗi xác thực:**
- `"No token provided"`: Không có token
- `"Invalid token format"`: Token rỗng hoặc không hợp lệ
- `"Invalid token: <error>"`: Token không thể verify

---

## 2. Connection Management

### 2.1. Khi Client Kết Nối

**Quy trình:**
1. **Xác thực token** qua middleware
2. **Join vào room với userId**: `socket.join(userId)` - cho phép gửi message trực tiếp đến user
3. **Tracking socket connections**: Lưu danh sách socket của mỗi user
4. **Cập nhật trạng thái user**: Nếu đây là socket đầu tiên, cập nhật status = "online"
5. **Giới hạn kết nối**: Tối đa 2 socket mỗi user, đóng các socket cũ nếu vượt quá

**Code:**
```javascript
const userId = socket.user._id.toString();
socket.join(userId); // Join vào room với userId

// Tracking
if (!userSockets.has(userId)) {
  userSockets.set(userId, []);
}
userSockets.get(userId).push(socket.id);
```

### 2.2. Ping/Pong Mechanism

**Mục đích:** Giữ kết nối sống và phát hiện disconnect

**Cơ chế:**
- Client gửi `ping_server` mỗi 5 giây
- Server trả về `pong_server` với timestamp
- Timeout 15 giây: Nếu không nhận được ping trong 15 giây, tự động disconnect

**Events:**
- **Client → Server:** `ping_server`
- **Server → Client:** `pong_server` với `{ time: Date.now() }`

**Code:**
```javascript
socket.on("ping_server", () => {
  clearTimeout(pingTimeout);
  pingTimeout = setTimeout(() => {
    socket.disconnect(true);
  }, 15000);
  socket.emit("pong_server", { time: Date.now() });
});
```

### 2.3. Khi Client Ngắt Kết Nối

**Quy trình:**
1. Xóa socket khỏi danh sách tracking
2. Nếu user không còn socket nào, cập nhật status = "offline"
3. Xóa socket khỏi map `userSockets`

**Code:**
```javascript
socket.on("disconnect", (reason) => {
  const userSocketList = userSockets.get(userId);
  if (userSocketList) {
    const index = userSocketList.indexOf(socket.id);
    if (index > -1) {
      userSocketList.splice(index, 1);
    }
    if (userSocketList.length === 0) {
      userSockets.delete(userId);
      UserService.updateUserStatus(userId, "offline");
    }
  }
});
```

---

## 3. Room Socket Events

### 3.1. Join Room

**Event:** `join_room`

**Request:**
```javascript
{
  roomId: "room_id",
  password: "string (optional)"
}
```

**Response - Success:**
```javascript
socket.emit("join_success", {
  room: roomObject,
  message: "Bạn đã tham gia phòng thành công",
  timestamp: "ISO string"
});
```

**Response - Error:**
```javascript
socket.emit("join_error", {
  message: "Lỗi message"
});
```

**Broadcast Events:**
- `player_joined`: Gửi cho các user khác trong phòng
- `room_update`: Gửi cho tất cả user trong phòng

**Quy trình:**
1. Kiểm tra user đã ở trong phòng chưa (reconnect check)
2. Gọi `RoomService.joinRoom()` để thêm user vào phòng
3. Lưu mapping `socketToRoom.set(socket.id, roomId)`
4. Join socket vào room: `socket.join(roomId)`
5. Emit events cho client và broadcast cho các user khác

**Lưu ý:**
- Có cơ chế chống duplicate join requests (1 giây)
- Nếu user đã ở trong phòng, chỉ emit `room_update` cho user đó (reconnect)

---

### 3.2. Player Ready

**Event:** `player_ready`

**Request:**
```javascript
{
  roomId: "room_id",
  isReady: true/false
}
```

**Response - Success:**
```javascript
// Broadcast cho tất cả user trong phòng
io.to(roomId).emit("player_ready_status", {
  userId: "user_id",
  username: "username",
  isReady: true/false,
  room: roomObject,
  allNonHostReady: true/false,
  message: "Nickname đã sẵn sàng",
  timestamp: "ISO string"
});

io.to(roomId).emit("room_update", {
  room: roomObject,
  allNonHostReady: true/false,
  message: "Nickname đã sẵn sàng",
  timestamp: "ISO string"
});
```

**Response - Error:**
```javascript
socket.emit("ready_error", {
  message: "Lỗi message"
});
```

**Quy trình:**
1. Kiểm tra phòng tồn tại và chưa bắt đầu game
2. Gọi `RoomService.toggleReady()` để cập nhật trạng thái ready
3. Broadcast events cho tất cả user trong phòng

**Lưu ý:**
- Chủ phòng không cần ready
- Tất cả người chơi (trừ chủ phòng) phải ready trước khi bắt đầu game

---

### 3.3. Start Game

**Event:** `start_game`

**Request:**
```javascript
{
  roomId: "room_id"
}
```

**Response - Success:**
```javascript
// Broadcast cho tất cả user trong phòng
io.to(roomId).emit("game_start", {
  players: [...],
  room: roomObject,
  board: [[...]], // 20x20 board
  turn: "X" | "O",
  currentPlayerIndex: 0,
  history: [],
  playerMarks: {
    "user_id_1": "X",
    "user_id_2": "O"
  },
  turnTimeLimit: 30,
  turnStartTime: timestamp,
  firstTurn: "X" | "O",
  message: "Chủ phòng đã bắt đầu game!",
  timestamp: "ISO string"
});

io.to(roomId).emit("room_update", {
  room: roomObject,
  message: "Game đã bắt đầu",
  timestamp: "ISO string"
});
```

**Response - Error:**
```javascript
socket.emit("start_error", {
  message: "Lỗi message"
});
```

**Quy trình:**
1. Kiểm tra quyền: Chỉ chủ phòng mới có thể start
2. Kiểm tra điều kiện:
   - Phòng chưa bắt đầu game
   - Có ít nhất 2 người chơi
   - Tất cả người chơi (trừ chủ phòng) đã ready
3. Cập nhật room status = "playing"
4. Khởi tạo game state:
   - Tạo bàn cờ 20x20
   - Gán playerMarks (X/O)
   - Xác định firstTurn
   - Set currentPlayerIndex
5. Khởi tạo ping tracking cho tất cả players
6. Bắt đầu turn timer
7. Cập nhật status = "in_game" cho tất cả players
8. Broadcast events

**Lưu ý:**
- Game state được lưu trong memory (`roomGames[roomId]`)
- Turn timer được bắt đầu ngay khi game start
- Ping tracking được khởi tạo để phát hiện disconnect khi đang chơi

---

### 3.4. Leave Room

**Event:** `leave_room`

**Request:**
```javascript
{
  roomId: "room_id"
}
```

**Response - Success:**
```javascript
socket.emit("leave_success", {
  message: "Bạn đã rời phòng",
  timestamp: "ISO string"
});

// Broadcast cho các user khác
io.to(roomId).emit("player_left", {
  userId: "user_id",
  username: "username",
  nickname: "nickname",
  room: roomObject,
  message: "Nickname đã rời phòng",
  timestamp: "ISO string"
});

io.to(roomId).emit("room_update", {
  room: roomObject,
  message: "Nickname đã rời phòng",
  timestamp: "ISO string"
});
```

**Response - Error:**
```javascript
socket.emit("leave_error", {
  message: "Lỗi message"
});
```

**Quy trình:**
1. Nếu đang chơi:
   - Tự động kết thúc game (người còn lại thắng)
   - Cập nhật game stats
   - Lưu lịch sử game
   - Emit `game_end` event
   - Cleanup game state, move lock, ping tracking
2. Gọi `RoomService.leaveRoom()` để xóa user khỏi phòng
3. Xóa socket mapping và leave socket room
4. Cleanup ping tracking
5. Cập nhật status = "online" (nếu không đang chơi)
6. Emit events

**Lưu ý:**
- Nếu rời phòng khi đang chơi, tự động coi như đầu hàng
- Nếu phòng không còn ai, phòng sẽ bị xóa và emit `room_deleted`

---

### 3.5. Update Room Settings

**Event:** `update_room_settings`

**Request:**
```javascript
{
  roomId: "room_id",
  playerMarks: { // optional
    "user_id_1": "X",
    "user_id_2": "O"
  },
  turnTimeLimit: 30, // optional (10-300 giây)
  firstTurn: "X" | "O" // optional
}
```

**Response - Success:**
```javascript
// Broadcast cho tất cả user trong phòng
io.to(roomId).emit("room_settings_updated", {
  room: roomObject,
  playerMarks: {...},
  turnTimeLimit: 30,
  firstTurn: "X",
  message: "Nickname đã cập nhật cài đặt phòng",
  timestamp: "ISO string"
});

io.to(roomId).emit("room_update", {
  room: roomObject,
  message: "Cài đặt phòng đã được cập nhật",
  timestamp: "ISO string"
});
```

**Response - Error:**
```javascript
socket.emit("room_settings_error", {
  message: "Lỗi message"
});
```

**Quy trình:**
1. Kiểm tra quyền: Chỉ chủ phòng mới có thể chỉnh sửa
2. Kiểm tra điều kiện: Phòng phải ở trạng thái "waiting"
3. Validate dữ liệu:
   - `playerMarks`: Phải có đúng 1 X và 1 O
   - `turnTimeLimit`: 10-300 giây
   - `firstTurn`: X hoặc O
4. Cập nhật room trong database
5. Broadcast events

**Lưu ý:**
- Chỉ có thể chỉnh sửa khi phòng chưa bắt đầu game
- Validation nghiêm ngặt để đảm bảo game logic đúng

---

### 3.6. Kick Player

**Event:** `kick_player`

**Request:**
```javascript
{
  roomId: "room_id",
  targetUserId: "user_id"
}
```

**Response - Success:**
```javascript
// Gửi cho player bị kick
targetSocket.emit("player_kicked", {
  roomId: "room_id",
  message: "Bạn đã bị đuổi khỏi phòng bởi chủ phòng",
  timestamp: "ISO string"
});

// Gửi cho chủ phòng
socket.emit("kick_success", {
  message: "Đã đuổi Nickname ra khỏi phòng",
  timestamp: "ISO string"
});

// Broadcast cho các user khác
io.to(roomId).emit("player_left", {
  userId: "target_user_id",
  username: "username",
  nickname: "nickname",
  room: roomObject,
  message: "Nickname đã bị đuổi khỏi phòng",
  timestamp: "ISO string"
});

io.to(roomId).emit("room_update", {
  room: roomObject,
  message: "Nickname đã bị đuổi khỏi phòng",
  timestamp: "ISO string"
});
```

**Response - Error:**
```javascript
socket.emit("kick_error", {
  message: "Lỗi message"
});
```

**Quy trình:**
1. Kiểm tra quyền: Chỉ chủ phòng mới có thể kick
2. Kiểm tra: Không thể kick chính mình
3. Nếu đang chơi:
   - Tự động kết thúc game (chủ phòng thắng)
   - Cập nhật game stats
   - Lưu lịch sử game
   - Emit `game_end` event
   - Cleanup game state
4. Gọi `RoomService.leaveRoom()` để xóa player khỏi phòng
5. Tìm socket của player bị kick và thông báo
6. Xóa socket mapping và cleanup
7. Cập nhật status = "online" cho player bị kick
8. Emit events

**Lưu ý:**
- Nếu kick khi đang chơi, tự động coi như chủ phòng thắng
- Player bị kick sẽ nhận được `player_kicked` event

---

### 3.7. Invite To Room

**Event:** `invite_to_room`

**Request:**
```javascript
{
  roomId: "room_id",
  friendId: "user_id"
}
```

**Response - Success:**
```javascript
// Gửi cho người được mời
io.to(friendId).emit("room:invite", {
  roomId: "room_id",
  roomName: "room_name",
  inviterId: "user_id",
  inviter: {
    _id: "user_id",
    username: "username",
    nickname: "nickname",
    avatarUrl: "url"
  },
  timestamp: "ISO string"
});

// Gửi cho người mời
socket.emit("invite_success", {
  message: "Đã gửi lời mời đến friendId",
  timestamp: "ISO string"
});
```

**Response - Error:**
```javascript
socket.emit("invite_error", {
  message: "Lỗi message"
});
```

**Quy trình:**
1. Kiểm tra roomId và friendId có hợp lệ
2. Kiểm tra user có trong phòng không
3. Gửi `room:invite` event đến friendId (sử dụng room với userId)
4. Xác nhận cho người mời

**Lưu ý:**
- Event được gửi trực tiếp đến user qua `io.to(friendId)`
- Frontend sẽ hiển thị notification cho người được mời

---

### 3.8. Check Reconnect

**Event:** `check_reconnect`

**Request:** Không có (chỉ emit event)

**Response:**
```javascript
// Nếu có trong phòng
socket.emit("reconnect_check", {
  inRoom: true,
  room: roomObject,
  gameState: { // nếu đang chơi
    board: [[...]],
    turn: "X",
    history: [...],
    currentPlayerIndex: 0
  },
  message: "Bạn vẫn đang trong phòng"
});

// Nếu đã reconnect thành công
socket.emit("reconnect_success", {
  room: roomObject,
  gameState: {...},
  message: "Đã kết nối lại với phòng thành công",
  timestamp: "ISO string"
});

// Broadcast cho các user khác
socket.to(roomId).emit("player_reconnected", {
  userId: "user_id",
  username: "username",
  nickname: "nickname",
  room: roomObject,
  message: "Nickname đã kết nối lại",
  timestamp: "ISO string"
});
```

**Quy trình:**
1. Tìm phòng mà user đang tham gia
2. Nếu không có phòng, trả về `inRoom: false`
3. Kiểm tra player có đang disconnected không
4. Nếu đang disconnected:
   - Đánh dấu reconnected
   - Join lại socket room
   - Lấy game state nếu đang chơi
   - Khởi tạo lại ping tracking
   - Emit `reconnect_success`
   - Broadcast `player_reconnected`
5. Nếu chưa disconnected:
   - Chỉ join lại socket room
   - Lấy game state nếu đang chơi
   - Emit `reconnect_check`

**Lưu ý:**
- Dùng để khôi phục kết nối sau khi mất kết nối
- Game state được gửi lại để client có thể khôi phục UI

---

### 3.9. Ping Room (Khi Đang Chơi)

**Event:** `ping_room`

**Request:**
```javascript
{
  roomId: "room_id"
}
```

**Response:**
```javascript
socket.emit("room_pong", {
  roomId: "room_id",
  timestamp: timestamp,
  timeRemaining: 30000 // milliseconds
});
```

**Quy trình:**
1. Kiểm tra phòng đang ở trạng thái "playing"
2. Cập nhật last ping time
3. Xóa timeout cũ và tạo timeout mới (30 giây)
4. Trả về `room_pong` với thời gian còn lại

**Lưu ý:**
- Dùng để phát hiện disconnect khi đang chơi
- Nếu không ping trong 30 giây, tự động đẩy player ra khỏi phòng
- Timeout được reset mỗi khi nhận được ping

---

## 4. Game Socket Events

### 4.1. Make Move

**Event:** `make_move`

**Request:**
```javascript
{
  roomId: "room_id",
  x: 5, // row (0-19)
  y: 5  // col (0-19)
}
```

**Response - Success:**
```javascript
// Broadcast cho tất cả user trong phòng
io.to(roomId).emit("move_made", {
  x: 5,
  y: 5,
  mark: "X",
  userId: "user_id",
  username: "username",
  board: [[...]], // bàn cờ sau khi đánh
  turn: "O", // lượt tiếp theo
  currentPlayer: {...},
  currentPlayerIndex: 1,
  history: [...],
  lastMove: { x, y, mark, userId, username, nickname },
  message: "Nickname đã đánh tại (5, 5)",
  timestamp: "ISO string",
  turnTimeLimit: 30
});

// Nếu có người thắng
io.to(roomId).emit("game_end", {
  result: {
    winner: "user_id",
    winnerUsername: "username",
    winnerNickname: "nickname",
    winnerMark: "X",
    message: "Nickname thắng!",
    winningMove: { x: 5, y: 5 }
  },
  board: [[...]],
  lastMove: {...},
  message: "Nickname thắng!",
  timestamp: "ISO string"
});

// Nếu hòa
io.to(roomId).emit("game_end", {
  result: {
    winner: null,
    message: "Hòa!"
  },
  board: [[...]],
  lastMove: {...},
  message: "Hòa!",
  timestamp: "ISO string"
});

// Nếu chưa kết thúc, emit turn_started
io.to(roomId).emit("turn_started", {
  turnStartTime: timestamp,
  turnTimeLimit: 30,
  currentPlayerIndex: 1,
  turn: "O",
  timestamp: "ISO string"
});
```

**Response - Error:**
```javascript
socket.emit("move_error", {
  message: "Lỗi message",
  currentPlayer: "nickname" // nếu chưa đến lượt
});
```

**Quy trình:**
1. **Lock mechanism**: Kiểm tra và đặt lock để tránh xử lý nhiều move cùng lúc
2. **Validation:**
   - Phòng tồn tại và đang ở trạng thái "playing"
   - User có trong phòng
   - Đúng lượt của user
   - Vị trí (x, y) hợp lệ (0-19)
   - Vị trí chưa có cờ
3. **Thực hiện move:**
   - Lưu trạng thái cũ để rollback nếu có lỗi
   - Cập nhật bàn cờ: `board[x][y] = mark`
   - Thêm vào history
4. **Kiểm tra kết quả:**
   - Kiểm tra thắng bằng `checkWinner()`
   - Kiểm tra hòa (bàn cờ đầy)
5. **Emit move_made** cho tất cả user
6. **Nếu có người thắng:**
   - Tạo gameResult
   - Gọi `RoomService.endGame()`
   - Cập nhật game stats cho cả 2 người chơi
   - Lưu lịch sử game vào database
   - Emit `game_end`
   - Cleanup: stop timer, cleanup ping tracking, giải phóng lock
7. **Nếu hòa:**
   - Tương tự như thắng nhưng winner = null
   - Cập nhật stats là draw cho cả 2 người
8. **Nếu chưa kết thúc:**
   - Đổi lượt
   - Dừng timer cũ, bắt đầu timer mới
   - Emit `turn_started`
   - Giải phóng lock

**Lưu ý:**
- Có cơ chế lock để tránh race condition
- Có rollback mechanism nếu có lỗi
- Game state được lưu trong memory (`roomGames[roomId]`)
- Turn timer được quản lý tự động

---

### 4.2. Undo Move

**Event:** `undo_move`

**Request:**
```javascript
{
  roomId: "room_id"
}
```

**Response - Success:**
```javascript
// Broadcast cho tất cả user trong phòng
io.to(roomId).emit("move_undone", {
  board: [[...]],
  turn: "X",
  currentPlayer: {...},
  currentPlayerIndex: 0,
  undoneMoves: [...],
  history: [...],
  message: "Nickname đã hoàn tác 1 nước đi",
  timestamp: "ISO string"
});
```

**Response - Error:**
```javascript
socket.emit("undo_error", {
  message: "Lỗi message"
});
```

**Quy trình:**
1. Kiểm tra phòng tồn tại và đang chơi
2. Kiểm tra có nước đi để undo không
3. Kiểm tra quyền:
   - Chỉ có thể undo nước đi của chính mình
   - Hoặc nếu là host thì có thể undo bất kỳ
4. Xóa nước đi (hoặc 2 nước nếu vs Bot)
5. Đổi lại lượt
6. Broadcast `move_undone`

**Lưu ý:**
- Nếu chơi vs Bot (1 player), undo 2 nước (của cả player và bot)
- Nếu chơi P2P (2 players), chỉ undo 1 nước

---

### 4.3. Reset Game

**Event:** `reset_game`

**Request:**
```javascript
{
  roomId: "room_id"
}
```

**Response - Success:**
```javascript
// Broadcast cho tất cả user trong phòng
io.to(roomId).emit("game_reset", {
  board: [[...]], // bàn cờ rỗng
  turn: "X",
  currentPlayerIndex: 0,
  currentPlayer: {...},
  room: roomObject,
  message: "Nickname đã reset game",
  timestamp: "ISO string"
});

io.to(roomId).emit("room_update", {
  room: roomObject,
  message: "Game đã được reset",
  timestamp: "ISO string"
});
```

**Response - Error:**
```javascript
socket.emit("reset_error", {
  message: "Lỗi message"
});
```

**Quy trình:**
1. Kiểm tra quyền: Chỉ chủ phòng mới có thể reset
2. Giải phóng move lock nếu có
3. Dừng turn timer
4. Reset game state:
   - Bàn cờ rỗng
   - Turn = "X"
   - History = []
   - currentPlayerIndex = 0
5. Cập nhật room status = "waiting" và reset ready status
6. Broadcast events

**Lưu ý:**
- Chỉ chủ phòng mới có quyền reset
- Reset sẽ đưa phòng về trạng thái "waiting"

---

### 4.4. Request Draw

**Event:** `request_draw`

**Request:**
```javascript
{
  roomId: "room_id"
}
```

**Response - Success:**
```javascript
// Broadcast cho tất cả user trong phòng
io.to(roomId).emit("draw_requested", {
  requesterId: "user_id",
  requesterUsername: "username",
  requesterNickname: "nickname",
  message: "Nickname muốn xin hòa",
  timestamp: "ISO string"
});
```

**Response - Error:**
```javascript
socket.emit("draw_error", {
  message: "Lỗi message"
});
```

**Quy trình:**
1. Kiểm tra phòng tồn tại và đang chơi
2. Kiểm tra user có trong phòng
3. Lưu yêu cầu xin hòa vào `pendingDrawRequests[roomId]`
4. Broadcast `draw_requested`

**Lưu ý:**
- Frontend sẽ hiển thị dialog xác nhận cho đối thủ
- Yêu cầu sẽ được lưu cho đến khi được phản hồi hoặc hủy

---

### 4.5. Cancel Draw

**Event:** `cancel_draw`

**Request:**
```javascript
{
  roomId: "room_id"
}
```

**Response - Success:**
```javascript
// Broadcast cho tất cả user trong phòng
io.to(roomId).emit("draw_cancelled", {
  requesterId: "user_id",
  requesterUsername: "username",
  requesterNickname: "nickname",
  message: "Nickname đã hủy yêu cầu xin hòa",
  timestamp: "ISO string"
});
```

**Response - Error:**
```javascript
socket.emit("draw_error", {
  message: "Lỗi message"
});
```

**Quy trình:**
1. Kiểm tra có yêu cầu xin hòa đang chờ không
2. Kiểm tra quyền: Chỉ người gửi yêu cầu mới có thể hủy
3. Xóa yêu cầu khỏi `pendingDrawRequests`
4. Broadcast `draw_cancelled`

---

### 4.6. Respond Draw

**Event:** `respond_draw`

**Request:**
```javascript
{
  roomId: "room_id",
  accept: true/false
}
```

**Response - Success:**
```javascript
// Nếu chấp nhận
io.to(roomId).emit("draw_accepted", {
  message: "Nickname đã chấp nhận xin hòa. Game kết thúc hòa!",
  timestamp: "ISO string"
});

io.to(roomId).emit("game_end", {
  result: {
    winner: null,
    message: "Hòa! (Cả hai người chơi đồng ý)"
  },
  board: [[...]],
  message: "Hòa! (Cả hai người chơi đồng ý)",
  timestamp: "ISO string"
});

// Nếu từ chối
io.to(roomId).emit("draw_rejected", {
  rejectorId: "user_id",
  rejectorUsername: "username",
  rejectorNickname: "nickname",
  message: "Nickname đã từ chối xin hòa",
  timestamp: "ISO string"
});
```

**Response - Error:**
```javascript
socket.emit("draw_error", {
  message: "Lỗi message"
});
```

**Quy trình:**
1. Kiểm tra phòng tồn tại và đang chơi
2. Kiểm tra có yêu cầu xin hòa đang chờ không
3. Kiểm tra người phản hồi không phải là người gửi yêu cầu
4. Xóa yêu cầu khỏi `pendingDrawRequests`
5. Nếu chấp nhận:
   - Tạo gameResult với winner = null
   - Gọi `RoomService.endGame()`
   - Cập nhật game stats là draw cho cả 2 người
   - Lưu lịch sử game
   - Emit `draw_accepted` và `game_end`
   - Cleanup game state
6. Nếu từ chối:
   - Chỉ emit `draw_rejected`
   - Game tiếp tục

---

### 4.7. Surrender Game

**Event:** `surrender_game`

**Request:**
```javascript
{
  roomId: "room_id"
}
```

**Response - Success:**
```javascript
// Broadcast cho tất cả user trong phòng
io.to(roomId).emit("game_end", {
  result: {
    winner: "opponent_user_id",
    winnerUsername: "username",
    winnerNickname: "nickname",
    loser: "user_id",
    loserUsername: "username",
    loserNickname: "nickname",
    message: "Nickname đã đầu hàng. Opponent thắng!",
    isSurrender: true
  },
  board: [[...]],
  message: "Nickname đã đầu hàng. Opponent thắng!",
  timestamp: "ISO string"
});

io.to(roomId).emit("room_update", {
  room: roomObject,
  message: "Game đã kết thúc",
  timestamp: "ISO string"
});
```

**Response - Error:**
```javascript
socket.emit("surrender_error", {
  message: "Lỗi message"
});
```

**Quy trình:**
1. Kiểm tra phòng tồn tại và đang chơi
2. Kiểm tra user có trong phòng
3. Tìm người chơi còn lại (người thắng)
4. Tạo gameResult với isSurrender = true
5. Gọi `RoomService.endGame()`
6. Cập nhật game stats cho cả 2 người
7. Lưu lịch sử game
8. Dừng turn timer
9. Cleanup ping tracking
10. Xóa game state
11. Emit events

**Lưu ý:**
- Đầu hàng sẽ tự động thua
- Game stats được cập nhật cho cả 2 người chơi

---

### 4.8. Get Game State

**Event:** `get_game_state`

**Request:**
```javascript
{
  roomId: "room_id"
}
```

**Response - Success:**
```javascript
socket.emit("game_state", {
  board: [[...]],
  turn: "X",
  history: [...],
  currentPlayer: {...},
  currentPlayerIndex: 0,
  players: [...],
  room: roomObject,
  turnStartTime: timestamp,
  turnTimeLimit: 30,
  timestamp: "ISO string"
});
```

**Response - Error:**
```javascript
socket.emit("game_state_error", {
  message: "Lỗi message"
});
```

**Quy trình:**
1. Kiểm tra phòng tồn tại
2. Lấy game state từ memory
3. Lấy turnTimeLimit từ room
4. Emit `game_state` với đầy đủ thông tin

**Lưu ý:**
- Dùng để khôi phục game state khi reconnect
- Trả về đầy đủ thông tin để client có thể khôi phục hoàn toàn

---

## 5. Chat Socket Events

### 5.1. Send Message

**Event:** `send_message`

**Request:**
```javascript
{
  roomId: "room_id", // optional (nếu là chat trong phòng)
  receiverId: "user_id", // optional (nếu là chat riêng)
  message: "Nội dung tin nhắn",
  type: "text" // default: "text"
}
```

**Response - Success:**
```javascript
// Broadcast cho tất cả user trong phòng (nếu là chat trong phòng)
// Hoặc gửi cho receiver (nếu là chat riêng)
io.to(roomId || receiverId).emit("message_received", {
  _id: "message_id",
  message: "Nội dung tin nhắn",
  type: "text",
  senderId: "user_id",
  sender: {
    _id: "user_id",
    username: "username",
    nickname: "nickname",
    avatarUrl: "url"
  },
  roomId: "room_id" || null,
  receiverId: "user_id" || null,
  isRead: false,
  createdAt: "ISO string",
  timestamp: timestamp
});
```

**Response - Error:**
```javascript
socket.emit("chat_error", {
  message: "Lỗi message"
});
```

**Quy trình:**
1. Validate message không rỗng
2. Nếu là chat trong phòng:
   - Kiểm tra phòng tồn tại
   - Kiểm tra user có trong phòng không
3. Lưu tin nhắn vào database
4. Format dữ liệu tin nhắn
5. Emit `message_received`:
   - Nếu là chat trong phòng: broadcast cho tất cả user trong phòng
   - Nếu là chat riêng: gửi cho receiver và gửi lại cho sender để xác nhận

**Lưu ý:**
- Cần có ít nhất một trong hai: `roomId` hoặc `receiverId`
- Tin nhắn được lưu vào database để có thể xem lại sau

---

### 5.2. Get Room Messages

**Event:** `get_room_messages`

**Request:**
```javascript
{
  roomId: "room_id",
  limit: 50 // optional, default: 50
}
```

**Response - Success:**
```javascript
socket.emit("room_messages", {
  roomId: "room_id",
  messages: [
    {
      _id: "message_id",
      message: "Nội dung",
      type: "text",
      senderId: {...},
      sender: {...},
      roomId: "room_id",
      isRead: true,
      createdAt: "ISO string"
    }
  ]
});
```

**Response - Error:**
```javascript
socket.emit("chat_error", {
  message: "Lỗi message"
});
```

**Quy trình:**
1. Kiểm tra roomId hợp lệ
2. Kiểm tra user có trong phòng không
3. Lấy lịch sử chat từ database (giới hạn 50 tin nhắn)
4. Đánh dấu tất cả tin nhắn trong phòng là đã đọc
5. Emit `room_messages`

---

### 5.3. Get Private Messages

**Event:** `get_private_messages`

**Request:**
```javascript
{
  userId: "user_id",
  limit: 50 // optional, default: 50
}
```

**Response - Success:**
```javascript
socket.emit("private_messages", {
  userId: "user_id",
  messages: [
    {
      _id: "message_id",
      message: "Nội dung",
      type: "text",
      senderId: "user_id",
      receiverId: "user_id",
      sender: {...},
      receiver: {...},
      isRead: true,
      createdAt: "ISO string",
      timestamp: timestamp
    }
  ]
});
```

**Response - Error:**
```javascript
socket.emit("chat_error", {
  message: "Lỗi message"
});
```

**Quy trình:**
1. Kiểm tra userId hợp lệ
2. Lấy lịch sử chat riêng giữa 2 người từ database
3. Format dữ liệu tin nhắn
4. Emit `private_messages`

---

## 6. Friend Socket Events

### 6.1. Add Friend

**Event:** `add_friend`

**Request:**
```javascript
{
  userId: "user_id",
  friendId: "friend_id"
}
```

**Lưu ý:** Event này hiện tại chỉ log, chưa có logic xử lý đầy đủ. Logic kết bạn chủ yếu được xử lý qua REST API.

---

## 7. Game State Management

### 7.1. Game State Structure

**Lưu trữ:** `roomGames[roomId]` (in-memory)

**Cấu trúc:**
```javascript
{
  board: [[...]], // 20x20 array, null = ô trống, "X" hoặc "O" = đã đánh
  turn: "X" | "O", // Lượt hiện tại
  history: [
    {
      x: 5,
      y: 5,
      mark: "X",
      userId: "user_id",
      username: "username",
      nickname: "nickname",
      timestamp: "ISO string"
    }
  ],
  currentPlayerIndex: 0, // Index của player đang đến lượt
  turnStartTime: timestamp, // Thời gian bắt đầu lượt hiện tại
  turnTimer: timeout // Timer cho lượt hiện tại
}
```

### 7.2. Init Game

**Function:** `initGameForRoom(roomId, players)`

**Quy trình:**
1. Lấy room từ database
2. Lấy hoặc tạo `playerMarks` (mapping userId -> "X" hoặc "O")
3. Xác định `firstTurn` (X hoặc O)
4. Xác định `currentPlayerIndex` dựa trên `firstTurn`
5. Khởi tạo game state:
   - Bàn cờ 20x20 rỗng
   - Turn = firstTurn
   - History = []
   - currentPlayerIndex
   - turnStartTime = Date.now()

**Lưu ý:**
- `playerMarks` được lưu trong database (room.playerMarks)
- Mặc định: chủ phòng là X, player thứ 2 là O

---

## 8. Timer Management

### 8.1. Turn Timer

**Mục đích:** Giới hạn thời gian mỗi lượt chơi

**Cơ chế:**
- Timer được bắt đầu khi:
  - Game start
  - Sau mỗi nước đi (lượt mới)
- Timer được dừng khi:
  - Có nước đi mới
  - Game kết thúc
  - Reset game

**Timeout Handler:**
- Khi hết thời gian, tự động kết thúc game
- Người chơi hết thời gian thua
- Người chơi còn lại thắng
- Cập nhật game stats
- Lưu lịch sử game

**Code:**
```javascript
const timer = setTimeout(async () => {
  // Tạo gameResult với isTimeout = true
  await RoomService.endGame({ roomId, result: gameResult });
  // Cập nhật stats, emit events, cleanup
}, turnTimeLimit * 1000);
```

### 8.2. Ping Timeout (Khi Đang Chơi)

**Mục đích:** Phát hiện disconnect khi đang chơi

**Cơ chế:**
- Mỗi player phải gửi `ping_room` mỗi 30 giây khi đang chơi
- Nếu không ping trong 30 giây, tự động đẩy player ra khỏi phòng
- Game tự động kết thúc (người còn lại thắng)

**Tracking:**
- `roomPlayerPings[roomId][userId]` = lastPingTime
- `roomPingTimeouts[roomId_userId]` = timeout

**Lưu ý:**
- Chỉ áp dụng khi phòng đang ở trạng thái "playing"
- Timeout được reset mỗi khi nhận được ping

---

## 9. Disconnect Handling

### 9.1. Khi Disconnect Trong Phòng

**Quy trình:**
1. Lấy roomId từ `socketToRoom`
2. Nếu phòng chỉ có 1 player và player đó disconnect:
   - Tự động xóa phòng
   - Emit `room_deleted`
3. Nếu đang chơi:
   - Tự động kết thúc game (người còn lại thắng)
   - Cập nhật game stats
   - Lưu lịch sử game
   - Emit `game_end`
   - Cleanup game state
4. Xóa player khỏi phòng
5. Cleanup ping tracking
6. Emit `player_left` và `room_update`

**Lưu ý:**
- Disconnect khi đang chơi sẽ tự động thua
- Phòng sẽ bị xóa nếu không còn ai

---

## 10. Error Handling

### 10.1. Error Events

Tất cả các socket events đều có error handling:

**Pattern:**
```javascript
try {
  // Logic xử lý
} catch (err) {
  log("error", err.message);
  socket.emit("<event>_error", { message: err.message });
}
```

### 10.2. Common Errors

- **"Phòng không tồn tại"**: RoomId không hợp lệ hoặc phòng đã bị xóa
- **"Bạn không ở trong phòng này"**: User không có trong phòng
- **"Game chưa bắt đầu hoặc đã kết thúc"**: Phòng không ở trạng thái "playing"
- **"Chưa đến lượt bạn"**: Không phải lượt của user
- **"Vị trí không hợp lệ"**: Tọa độ (x, y) ngoài phạm vi 0-19
- **"Vị trí này đã có cờ"**: Ô đã được đánh
- **"Chỉ chủ phòng mới có thể..."**: Không có quyền

---

## 11. Socket Rooms

### 11.1. Room Types

**1. User Room:**
- Tên: `userId` (string)
- Mục đích: Gửi message trực tiếp đến user
- Join: `socket.join(userId)` khi connect

**2. Game Room:**
- Tên: `roomId` (string)
- Mục đích: Broadcast events cho tất cả user trong phòng
- Join: `socket.join(roomId)` khi join room

### 11.2. Emit Patterns

**Broadcast to room:**
```javascript
io.to(roomId).emit("event", data); // Tất cả user trong phòng
```

**Send to specific user:**
```javascript
io.to(userId).emit("event", data); // Chỉ user đó
```

**Send to sender only:**
```javascript
socket.emit("event", data); // Chỉ client gửi request
```

**Broadcast except sender:**
```javascript
socket.to(roomId).emit("event", data); // Tất cả trừ sender
```

---

## 12. Best Practices

### 12.1. Authentication
- Luôn verify token trước khi xử lý events
- Token được lưu trong `socket.user` sau khi verify

### 12.2. Error Handling
- Luôn có try-catch cho mọi async operations
- Emit error events với message rõ ràng
- Log errors để debug

### 12.3. State Management
- Game state được lưu trong memory (nhanh)
- Room state được lưu trong database (persistent)
- Sync giữa memory và database khi cần

### 12.4. Performance
- Sử dụng lock để tránh race condition
- Cleanup timers và tracking khi không cần
- Giới hạn số lượng socket mỗi user

### 12.5. Reconnection
- Hỗ trợ reconnect với game state recovery
- Ping/pong để phát hiện disconnect
- Timeout để tự động cleanup

---

## 13. Tổng Kết Socket Events

### Room Events (9 events)
1. `join_room` - Tham gia phòng
2. `player_ready` - Đánh dấu sẵn sàng
3. `start_game` - Bắt đầu game
4. `leave_room` - Rời phòng
5. `update_room_settings` - Cập nhật cài đặt
6. `kick_player` - Đuổi người chơi
7. `invite_to_room` - Mời bạn vào phòng
8. `check_reconnect` - Kiểm tra và reconnect
9. `ping_room` - Ping khi đang chơi

### Game Events (8 events)
1. `make_move` - Đánh cờ
2. `undo_move` - Hoàn tác nước đi
3. `reset_game` - Reset game
4. `request_draw` - Xin hòa
5. `cancel_draw` - Hủy yêu cầu xin hòa
6. `respond_draw` - Phản hồi yêu cầu xin hòa
7. `surrender_game` - Đầu hàng
8. `get_game_state` - Lấy trạng thái game

### Chat Events (3 events)
1. `send_message` - Gửi tin nhắn
2. `get_room_messages` - Lấy lịch sử chat phòng
3. `get_private_messages` - Lấy lịch sử chat riêng

### Friend Events (1 event)
1. `add_friend` - Thêm bạn (chưa implement đầy đủ)

### System Events (2 events)
1. `ping_server` - Ping để giữ kết nối
2. `disconnect` - Ngắt kết nối (tự động)

**Tổng cộng: 23 socket events**

---

## 14. Flow Diagrams

### 14.1. Game Flow

```
1. User join room → join_room
2. User ready → player_ready
3. Host start game → start_game
   - Init game state
   - Start turn timer
   - Init ping tracking
4. Player make move → make_move
   - Validate move
   - Update board
   - Check winner/draw
   - Switch turn
   - Start new turn timer
5. Game end (winner/draw/surrender/timeout)
   - Update stats
   - Save history
   - Cleanup
```

### 14.2. Reconnection Flow

```
1. Client disconnect
2. Server mark player as disconnected
3. Client reconnect
4. Client emit check_reconnect
5. Server check room and game state
6. Server mark player as reconnected
7. Server send game state to client
8. Client restore UI
```

---

## 15. Security Considerations

1. **Authentication:** Tất cả events đều yêu cầu JWT token
2. **Authorization:** Kiểm tra quyền (host, player) trước khi xử lý
3. **Validation:** Validate tất cả input (roomId, coordinates, etc.)
4. **Rate Limiting:** Có thể thêm rate limiting cho các events quan trọng
5. **Input Sanitization:** Sanitize message content trước khi lưu

---

File này cung cấp tài liệu chi tiết về cách Socket.IO hoạt động trong hệ thống Game Caro Online. Tất cả các events, flows, và mechanisms đều được mô tả đầy đủ để developers có thể hiểu và maintain code dễ dàng.
