# Tài Liệu API Backend - Game Caro Online

## Tổng Quan

Backend API được tổ chức theo RESTful architecture với base URL: `/api`

Tất cả các response đều có format chuẩn:
```json
{
  "success": true/false,
  "message": "Thông báo",
  "data": {}
}
```

## Authentication

Hầu hết các API yêu cầu xác thực qua JWT token. Token được gửi trong header:
```
Authorization: Bearer <token>
```

---

## 1. Authentication APIs (`/api/auth`)

### 1.1. Đăng Ký Tài Khoản
**Endpoint:** `POST /api/auth/register`

**Mô tả:** Đăng ký tài khoản người dùng mới

**Authentication:** Không yêu cầu

**Request Body:**
```json
{
  "username": "string (5-15 ký tự)",
  "password": "string (8-20 ký tự)",
  "nickname": "string (5-15 ký tự)",
  "email": "string (định dạng email hợp lệ)"
}
```

**Validation:**
- `username`: 5-15 ký tự, không được trùng
- `password`: 8-20 ký tự
- `nickname`: 5-15 ký tự, không được trùng
- `email`: Định dạng email hợp lệ, không được trùng

**Response Success (200):**
```json
{
  "success": true,
  "message": "Registered successfully",
  "data": {
    "id": "user_id",
    "username": "username",
    "nickname": "nickname",
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

**Response Error:**
- `400`: Dữ liệu không hợp lệ
- `409`: Username/Nickname/Email đã tồn tại

---

### 1.2. Đăng Nhập
**Endpoint:** `POST /api/auth/login`

**Mô tả:** Đăng nhập vào hệ thống

**Authentication:** Không yêu cầu

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Login successfully",
  "data": {
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "id": "user_id",
    "username": "username",
    "nickname": "nickname",
    "avatarUrl": "url_string"
  }
}
```

**Response Error:**
- `400`: Thiếu username hoặc password
- `401`: Tên đăng nhập hoặc mật khẩu không đúng

---

### 1.3. Quên Mật Khẩu
**Endpoint:** `POST /api/auth/forgot-password`

**Mô tả:** Gửi email reset mật khẩu

**Authentication:** Không yêu cầu

**Request Body:**
```json
{
  "email": "string"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Password reset email sent successfully",
  "data": {
    "message": "Email đã được gửi thành công"
  }
}
```

**Response Error:**
- `400`: Email không hợp lệ hoặc không tồn tại
- `500`: Lỗi gửi email

---

### 1.4. Refresh Token
**Endpoint:** `POST /api/auth/refresh`

**Mô tả:** Làm mới access token bằng refresh token

**Authentication:** Không yêu cầu

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

**Response Error:**
- `400`: Refresh token không hợp lệ hoặc thiếu

---

## 2. User APIs (`/api/users`)

### 2.1. Lấy Profile Của Chính Mình
**Endpoint:** `GET /api/users/profile`

**Mô tả:** Lấy thông tin profile đầy đủ của người dùng đang đăng nhập (bao gồm username, email)

**Authentication:** Yêu cầu (Bearer Token)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Lấy thông tin profile thành công",
  "data": {
    "_id": "user_id",
    "username": "username",
    "nickname": "nickname",
    "email": "email",
    "avatarUrl": "url_string",
    "wins": 0,
    "losses": 0,
    "draws": 0,
    "totalGames": 0,
    "winRate": 0,
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

**Response Error:**
- `401`: Chưa đăng nhập
- `404`: Không tìm thấy người dùng

---

### 2.2. Lấy Profile Của Người Dùng Khác
**Endpoint:** `GET /api/users/profile/:userId`

**Mô tả:** Lấy thông tin profile của một người dùng khác (không bao gồm username, email)

**Authentication:** Yêu cầu (Bearer Token)

**Path Parameters:**
- `userId`: ID của người dùng cần xem

**Response Success (200):**
```json
{
  "success": true,
  "message": "Lấy thông tin người dùng thành công",
  "data": {
    "_id": "user_id",
    "nickname": "nickname",
    "avatarUrl": "url_string",
    "wins": 0,
    "losses": 0,
    "draws": 0,
    "totalGames": 0,
    "winRate": 0,
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

**Response Error:**
- `401`: Chưa đăng nhập
- `404`: Không tìm thấy người dùng

---

### 2.3. Cập Nhật Profile
**Endpoint:** `PUT /api/users/profile`

**Mô tả:** Cập nhật thông tin profile (nickname, avatarUrl, password)

**Authentication:** Yêu cầu (Bearer Token)

**Request Body:** (Tất cả các trường đều optional)
```json
{
  "nickname": "string (5-15 ký tự, không trùng)",
  "avatarUrl": "string (URL)",
  "password": "string (8-20 ký tự)"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Cập nhật profile thành công",
  "data": {
    "_id": "user_id",
    "nickname": "updated_nickname",
    "avatarUrl": "updated_url",
    "wins": 0,
    "losses": 0,
    "draws": 0,
    "totalGames": 0,
    "winRate": 0
  }
}
```

**Response Error:**
- `400`: Dữ liệu không hợp lệ hoặc nickname đã tồn tại
- `401`: Chưa đăng nhập

---

### 2.4. Đổi Mật Khẩu
**Endpoint:** `POST /api/users/change-password`

**Mô tả:** Đổi mật khẩu của người dùng

**Authentication:** Yêu cầu (Bearer Token)

**Request Body:**
```json
{
  "oldPassword": "string",
  "newPassword": "string (8-20 ký tự)"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Đổi mật khẩu thành công",
  "data": {
    "message": "Đổi mật khẩu thành công"
  }
}
```

**Response Error:**
- `400`: Mật khẩu cũ không đúng hoặc mật khẩu mới không hợp lệ
- `401`: Chưa đăng nhập

---

### 2.5. Lấy Bảng Xếp Hạng
**Endpoint:** `GET /api/users/leaderboard`

**Mô tả:** Lấy danh sách người chơi xếp hạng theo thắng/thua

**Authentication:** Không yêu cầu (có thể public)

**Query Parameters:**
- `gameId`: (optional) ID của game, mặc định là "caro"

**Response Success (200):**
```json
{
  "success": true,
  "message": "Get leaderboard success",
  "data": [
    {
      "_id": "user_id",
      "nickname": "nickname",
      "avatarUrl": "url",
      "wins": 10,
      "losses": 5,
      "draws": 2,
      "totalGames": 17,
      "winRate": 58.82
    }
  ]
}
```

---

### 2.6. Lấy Lịch Sử Chơi Của Chính Mình
**Endpoint:** `GET /api/users/game-history`

**Mô tả:** Lấy lịch sử các trận đấu của người dùng đang đăng nhập

**Authentication:** Yêu cầu (Bearer Token)

**Query Parameters:**
- `limit`: (optional) Số lượng game trả về, mặc định 20
- `skip`: (optional) Số lượng game bỏ qua, mặc định 0

**Response Success (200):**
```json
{
  "success": true,
  "message": "Lấy lịch sử chơi thành công",
  "data": {
    "games": [
      {
        "_id": "game_id",
        "roomId": "room_id",
        "players": [
          {
            "_id": "user_id",
            "nickname": "nickname",
            "mark": "X"
          }
        ],
        "winner": "user_id",
        "result": "win",
        "moves": [],
        "createdAt": "date",
        "endedAt": "date"
      }
    ],
    "total": 50,
    "limit": 20,
    "skip": 0
  }
}
```

---

### 2.7. Lấy Lịch Sử Chơi Của Người Dùng Khác
**Endpoint:** `GET /api/users/game-history/:userId`

**Mô tả:** Lấy lịch sử các trận đấu của một người dùng khác

**Authentication:** Yêu cầu (Bearer Token)

**Path Parameters:**
- `userId`: ID của người dùng cần xem

**Query Parameters:**
- `limit`: (optional) Số lượng game trả về, mặc định 20
- `skip`: (optional) Số lượng game bỏ qua, mặc định 0

**Response Success (200):**
```json
{
  "success": true,
  "message": "Lấy lịch sử chơi thành công",
  "data": {
    "games": [...],
    "total": 50,
    "limit": 20,
    "skip": 0
  }
}
```

---

### 2.8. Lấy Chi Tiết Game
**Endpoint:** `GET /api/users/game/:gameId`

**Mô tả:** Lấy thông tin chi tiết của một trận đấu cụ thể

**Authentication:** Yêu cầu (Bearer Token)

**Path Parameters:**
- `gameId`: ID của game cần xem

**Response Success (200):**
```json
{
  "success": true,
  "message": "Lấy chi tiết game thành công",
  "data": {
    "_id": "game_id",
    "roomId": "room_id",
    "players": [...],
    "winner": "user_id",
    "result": "win",
    "moves": [
      {
        "row": 5,
        "col": 5,
        "mark": "X",
        "playerId": "user_id",
        "timestamp": "date"
      }
    ],
    "board": "array",
    "createdAt": "date",
    "endedAt": "date"
  }
}
```

---

## 3. Friend APIs (`/api/friend`)

Tất cả các API trong nhóm này đều yêu cầu authentication.

### 3.1. Lấy Danh Sách Bạn Bè
**Endpoint:** `GET /api/friend`

**Mô tả:** Lấy danh sách tất cả bạn bè của người dùng đang đăng nhập

**Authentication:** Yêu cầu (Bearer Token)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Get friends list success",
  "data": [
    {
      "_id": "friend_id",
      "nickname": "friend_nickname",
      "avatarUrl": "url",
      "status": "online/offline"
    }
  ]
}
```

---

### 3.2. Gửi Lời Mời Kết Bạn
**Endpoint:** `POST /api/friend/request`

**Mô tả:** Gửi lời mời kết bạn đến một người dùng khác

**Authentication:** Yêu cầu (Bearer Token)

**Request Body:**
```json
{
  "addresseeId": "user_id"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Friend request sent",
  "data": {
    "_id": "request_id",
    "requester": "requester_id",
    "addressee": "addressee_id",
    "status": "pending",
    "createdAt": "date"
  }
}
```

**Response Error:**
- `400`: Thiếu addresseeId hoặc đã gửi lời mời trước đó
- `401`: Chưa đăng nhập

---

### 3.3. Lấy Danh Sách Lời Mời Kết Bạn
**Endpoint:** `GET /api/friend/requests`

**Mô tả:** Lấy danh sách các lời mời kết bạn đang chờ (cả lời mời gửi đi và nhận về)

**Authentication:** Yêu cầu (Bearer Token)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Get pending requests success",
  "data": {
    "sent": [
      {
        "_id": "request_id",
        "addressee": {
          "_id": "user_id",
          "nickname": "nickname",
          "avatarUrl": "url"
        },
        "status": "pending",
        "createdAt": "date"
      }
    ],
    "received": [
      {
        "_id": "request_id",
        "requester": {
          "_id": "user_id",
          "nickname": "nickname",
          "avatarUrl": "url"
        },
        "status": "pending",
        "createdAt": "date"
      }
    ]
  }
}
```

---

### 3.4. Chấp Nhận Lời Mời Kết Bạn
**Endpoint:** `POST /api/friend/accept`

**Mô tả:** Chấp nhận một lời mời kết bạn

**Authentication:** Yêu cầu (Bearer Token)

**Request Body:**
```json
{
  "requesterId": "user_id"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Friend request accepted",
  "data": {
    "message": "Đã chấp nhận lời mời kết bạn"
  }
}
```

**Response Error:**
- `400`: Lời mời không tồn tại hoặc đã được xử lý
- `401`: Chưa đăng nhập

---

### 3.5. Hủy/Từ Chối Lời Mời Kết Bạn
**Endpoint:** `POST /api/friend/cancel`

**Mô tả:** Hủy lời mời đã gửi hoặc từ chối lời mời đã nhận

**Authentication:** Yêu cầu (Bearer Token)

**Request Body:**
```json
{
  "requesterId": "user_id"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Friend request canceled",
  "data": {}
}
```

---

### 3.6. Tìm Kiếm Người Dùng
**Endpoint:** `POST /api/friend/search`

**Mô tả:** Tìm kiếm người dùng theo nickname hoặc userID

**Authentication:** Yêu cầu (Bearer Token)

**Request Body:**
```json
{
  "nickname": "string (optional)",
  "userID": "string (optional)"
}
```

**Lưu ý:** Cần có ít nhất một trong hai trường `nickname` hoặc `userID`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Tìm kiếm thành công",
  "data": [
    {
      "_id": "user_id",
      "nickname": "nickname",
      "avatarUrl": "url",
      "isFriend": true/false,
      "hasPendingRequest": true/false
    }
  ]
}
```

**Response Error:**
- `400`: Thiếu tham số tìm kiếm
- `401`: Chưa đăng nhập

---

### 3.7. Hủy Kết Bạn
**Endpoint:** `POST /api/friend/unfriend`

**Mô tả:** Xóa bạn bè khỏi danh sách

**Authentication:** Yêu cầu (Bearer Token)

**Request Body:**
```json
{
  "friendId": "user_id"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Friend removed",
  "data": {}
}
```

**Response Error:**
- `400`: Không phải bạn bè hoặc không tồn tại
- `401`: Chưa đăng nhập

---

## 4. Room APIs (`/api/rooms`)

Tất cả các API trong nhóm này đều yêu cầu authentication.

### 4.1. Tạo Phòng Chơi
**Endpoint:** `POST /api/rooms/create`

**Mô tả:** Tạo một phòng chơi mới

**Authentication:** Yêu cầu (Bearer Token)

**Request Body:**
```json
{
  "name": "string (tên phòng)",
  "password": "string (optional, mật khẩu phòng)",
  "turnTimeLimit": "number (optional, thời gian mỗi lượt tính bằng giây)"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Tạo phòng thành công",
  "data": {
    "_id": "room_id",
    "name": "room_name",
    "hostId": "user_id",
    "hostUsername": "username",
    "players": [
      {
        "_id": "user_id",
        "username": "username",
        "nickname": "nickname",
        "isReady": false
      }
    ],
    "maxPlayers": 2,
    "turnTimeLimit": 30,
    "hasPassword": true/false,
    "status": "waiting",
    "createdAt": "date"
  }
}
```

**Response Error:**
- `400`: Dữ liệu không hợp lệ hoặc user đã có phòng
- `401`: Chưa đăng nhập

**Lưu ý:** Nếu user đã có phòng, API sẽ trả về phòng hiện tại với status code 200

---

### 4.2. Tham Gia Phòng
**Endpoint:** `POST /api/rooms/join`

**Mô tả:** Tham gia vào một phòng chơi có sẵn

**Authentication:** Yêu cầu (Bearer Token)

**Request Body:**
```json
{
  "roomId": "room_id",
  "password": "string (optional, nếu phòng có mật khẩu)"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Tham gia phòng thành công",
  "data": {
    "_id": "room_id",
    "name": "room_name",
    "hostId": "user_id",
    "players": [...],
    "maxPlayers": 2,
    "status": "waiting",
    "hasPassword": true
  }
}
```

**Response Error:**
- `400`: Phòng đầy, mật khẩu sai, hoặc đã ở trong phòng khác
- `401`: Chưa đăng nhập
- `404`: Không tìm thấy phòng

---

### 4.3. Rời Phòng
**Endpoint:** `POST /api/rooms/leave`

**Mô tả:** Rời khỏi phòng chơi hiện tại

**Authentication:** Yêu cầu (Bearer Token)

**Request Body:**
```json
{
  "roomId": "room_id"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Rời phòng thành công",
  "data": {
    "_id": "room_id",
    "players": [...],
    "status": "waiting"
  }
}
```

**Hoặc nếu phòng bị xóa (không còn người chơi):**
```json
{
  "success": true,
  "message": "Bạn đã rời phòng -> Phòng đã bị xóa",
  "data": {}
}
```

**Response Error:**
- `400`: Không ở trong phòng hoặc roomId không hợp lệ
- `401`: Chưa đăng nhập

---

### 4.4. Cập Nhật Thông Tin Phòng
**Endpoint:** `POST /api/rooms/update`

**Mô tả:** Cập nhật thông tin phòng (chỉ host mới có quyền)

**Authentication:** Yêu cầu (Bearer Token)

**Request Body:**
```json
{
  "roomId": "room_id",
  "data": {
    "name": "string (optional)",
    "password": "string (optional)",
    "turnTimeLimit": "number (optional)"
  }
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Cập nhật phòng thành công",
  "data": {
    "_id": "room_id",
    "name": "updated_name",
    "turnTimeLimit": 60,
    "hasPassword": true
  }
}
```

**Response Error:**
- `400`: Không phải host hoặc dữ liệu không hợp lệ
- `401`: Chưa đăng nhập

---

### 4.5. Bật/Tắt Trạng Thái Sẵn Sàng
**Endpoint:** `POST /api/rooms/toggle-ready`

**Mô tả:** Bật/tắt trạng thái sẵn sàng của người chơi. Khi cả 2 người chơi đều ready, game sẽ tự động bắt đầu.

**Authentication:** Yêu cầu (Bearer Token)

**Request Body:**
```json
{
  "roomId": "room_id",
  "isReady": true/false
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Cập nhật trạng thái thành công",
  "data": {
    "_id": "room_id",
    "players": [
      {
        "_id": "user_id",
        "isReady": true
      }
    ],
    "status": "waiting/playing"
  }
}
```

**Response Error:**
- `400`: Không ở trong phòng hoặc roomId không hợp lệ
- `401`: Chưa đăng nhập

**Lưu ý:** Khi game bắt đầu, server sẽ emit socket event `room:start` đến tất cả người chơi trong phòng

---

### 4.6. Kết Thúc Trận Đấu
**Endpoint:** `POST /api/rooms/end`

**Mô tả:** Kết thúc trận đấu và cập nhật kết quả

**Authentication:** Yêu cầu (Bearer Token)

**Request Body:**
```json
{
  "roomId": "room_id",
  "result": {
    "winner": "user_id (optional, null nếu hòa)",
    "result": "win/loss/draw/surrender",
    "moves": [...],
    "board": [...]
  }
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Trận đấu kết thúc",
  "data": {
    "_id": "room_id",
    "status": "finished",
    "gameResult": {...}
  }
}
```

**Response Error:**
- `400`: Dữ liệu không hợp lệ
- `401`: Chưa đăng nhập

**Lưu ý:** Server sẽ emit socket event `room:end` đến tất cả người chơi trong phòng

---

### 4.7. Lấy Danh Sách Phòng
**Endpoint:** `GET /api/rooms/list`

**Mô tả:** Lấy danh sách tất cả các phòng đang có

**Authentication:** Yêu cầu (Bearer Token)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Danh sách phòng",
  "data": [
    {
      "_id": "room_id",
      "name": "room_name",
      "hostId": "user_id",
      "hostUsername": "username",
      "players": [...],
      "maxPlayers": 2,
      "currentPlayers": 1,
      "hasPassword": true,
      "status": "waiting/playing",
      "turnTimeLimit": 30,
      "createdAt": "date"
    }
  ]
}
```

---

### 4.8. Kiểm Tra User Có Đang Ở Trong Phòng
**Endpoint:** `GET /api/rooms/check-user-room`

**Mô tả:** Kiểm tra xem người dùng đang đăng nhập có đang ở trong phòng nào không

**Authentication:** Yêu cầu (Bearer Token)

**Response Success (200):**
```json
{
  "success": true,
  "message": "User đang ở trong phòng",
  "data": {
    "inRoom": true,
    "room": {
      "_id": "room_id",
      "name": "room_name",
      "players": [...],
      "status": "waiting"
    }
  }
}
```

**Hoặc nếu không ở trong phòng:**
```json
{
  "success": true,
  "message": "User không đang ở trong phòng nào",
  "data": {
    "inRoom": false,
    "room": null
  }
}
```

---

### 4.9. Xác Minh Mật Khẩu Phòng
**Endpoint:** `POST /api/rooms/verify-password`

**Mô tả:** Xác minh mật khẩu của phòng trước khi tham gia

**Authentication:** Yêu cầu (Bearer Token)

**Request Body:**
```json
{
  "roomId": "room_id",
  "password": "string"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Mật khẩu đúng",
  "data": {
    "valid": true
  }
}
```

**Response Error:**
- `400`: Mật khẩu sai hoặc thiếu roomId
- `401`: Chưa đăng nhập
- `404`: Không tìm thấy phòng

---

## 5. Chat APIs (`/api/chat`)

Tất cả các API trong nhóm này đều yêu cầu authentication.

### 5.1. Lấy Lịch Sử Chat Của Phòng
**Endpoint:** `GET /api/chat/room/:roomId`

**Mô tả:** Lấy lịch sử tin nhắn trong phòng chơi (giới hạn 50 tin nhắn gần nhất)

**Authentication:** Yêu cầu (Bearer Token)

**Path Parameters:**
- `roomId`: ID của phòng

**Response Success (200):**
```json
{
  "success": true,
  "message": "Get room chat success",
  "data": {
    "messages": [
      {
        "_id": "message_id",
        "roomId": "room_id",
        "sender": {
          "_id": "user_id",
          "nickname": "nickname",
          "avatarUrl": "url"
        },
        "content": "message_content",
        "type": "room",
        "createdAt": "date",
        "readBy": ["user_id"]
      }
    ]
  }
}
```

---

### 5.2. Lấy Lịch Sử Chat Riêng Tư
**Endpoint:** `GET /api/chat/private/:userId`

**Mô tả:** Lấy lịch sử tin nhắn riêng tư giữa người dùng hiện tại và một người dùng khác (giới hạn 50 tin nhắn gần nhất)

**Authentication:** Yêu cầu (Bearer Token)

**Path Parameters:**
- `userId`: ID của người bạn đang chat

**Response Success (200):**
```json
{
  "success": true,
  "message": "Get private chat success",
  "data": {
    "messages": [
      {
        "_id": "message_id",
        "sender": {
          "_id": "user_id",
          "nickname": "nickname",
          "avatarUrl": "url"
        },
        "receiver": {
          "_id": "user_id",
          "nickname": "nickname"
        },
        "content": "message_content",
        "type": "private",
        "createdAt": "date",
        "readBy": ["user_id"]
      }
    ],
    "friend": {
      "_id": "user_id",
      "nickname": "nickname",
      "avatarUrl": "url"
    }
  }
}
```

---

### 5.3. Đánh Dấu Tin Nhắn Đã Đọc
**Endpoint:** `POST /api/chat/read/:messageId`

**Mô tả:** Đánh dấu một tin nhắn cụ thể là đã đọc

**Authentication:** Yêu cầu (Bearer Token)

**Path Parameters:**
- `messageId`: ID của tin nhắn

**Response Success (200):**
```json
{
  "success": true,
  "message": "Message marked as read",
  "data": {}
}
```

---

## 6. Bot APIs (`/api/bot`)

### 6.1. Tính Nước Đi Cho Bot
**Endpoint:** `POST /api/bot/move`

**Mô tả:** Tính toán và trả về nước đi tốt nhất cho bot dựa trên bàn cờ hiện tại và độ khó

**Authentication:** Yêu cầu (Bearer Token)

**Request Body:**
```json
{
  "board": "array (bàn cờ hiện tại, mảng 2D)",
  "botMark": "string (X hoặc O)",
  "difficulty": "string (optional, 'easy'/'medium'/'hard', mặc định 'medium')",
  "lastMove": {
    "row": "number (optional)",
    "col": "number (optional)"
  }
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Bot move generated",
  "data": {
    "move": {
      "row": 5,
      "col": 5
    },
    "difficulty": "medium"
  }
}
```

**Response Error:**
- `400`: Thiếu board hoặc botMark
- `401`: Chưa đăng nhập
- `500`: Lỗi tính toán

---

## 7. Health Check

### 7.1. Kiểm Tra Trạng Thái Server
**Endpoint:** `GET /health`

**Mô tả:** Kiểm tra server có đang hoạt động không

**Authentication:** Không yêu cầu

**Response Success (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

---

## Lưu Ý Chung

1. **Base URL:** Tất cả API đều có prefix `/api` (trừ `/health`)

2. **Authentication:** 
   - Token được gửi trong header: `Authorization: Bearer <token>`
   - Token có thời hạn, cần refresh khi hết hạn

3. **Error Response Format:**
   ```json
   {
     "success": false,
     "message": "Thông báo lỗi",
     "data": {}
   }
   ```

4. **Status Codes:**
   - `200`: Thành công
   - `201`: Tạo mới thành công
   - `400`: Bad Request (dữ liệu không hợp lệ)
   - `401`: Unauthorized (chưa đăng nhập hoặc token không hợp lệ)
   - `404`: Not Found (không tìm thấy resource)
   - `409`: Conflict (dữ liệu đã tồn tại)
   - `500`: Internal Server Error

5. **Socket.IO:** Ngoài REST API, hệ thống còn sử dụng Socket.IO cho real-time communication (game moves, chat, room updates, etc.)

---

## Tổng Kết

Tổng cộng có **28 API endpoints** được chia thành 6 nhóm chính:
- **Authentication:** 4 endpoints
- **User:** 8 endpoints
- **Friend:** 7 endpoints
- **Room:** 9 endpoints
- **Chat:** 3 endpoints
- **Bot:** 1 endpoint
- **Health Check:** 1 endpoint
