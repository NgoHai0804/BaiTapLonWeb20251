# Caro Online - Game History & Profile Features

## 📋 Tổng quan

Dự án đã được cập nhật với các tính năng mới:
- ✅ GameHistory Model & API
- ✅ Profile & Friends Management
- ✅ AI Bot với thuật toán Minimax
- ✅ Game Replay System
- ✅ Real-time Online Status

---

## 🎯 Các tính năng chính

### 1. **GameHistory System**

#### Backend Models
- **GameHistory Model** (`backend/src/models/gameHistory.model.js`)
  - Lưu roomId, moves[], winner, players
  - Tích hợp với User stats
  - Index cho performance

#### API Endpoints
```
GET /api/history/:userId        - Lấy lịch sử game
GET /api/history/detail/:gameId - Chi tiết game để replay
GET /api/history/stats/:userId  - Thống kê người chơi
POST /api/history/save          - Lưu kết quả game
```

#### Cách sử dụng
```javascript
// Sau khi game kết thúc, gọi API save
const gameData = {
  roomId: "room123",
  players: [
    { userId: "user1", username: "player1", symbol: "X", isWinner: true },
    { userId: "user2", username: "player2", symbol: "O", isWinner: false }
  ],
  moves: [
    { player: "X", position: { row: 7, col: 7 }, timestamp: new Date() },
    // ...more moves
  ],
  winner: "X",
  winnerUserId: "user1",
  boardSize: 15,
  gameMode: "online",
  duration: 600 // seconds
};

await axios.post('/api/history/save', gameData);
```

---

### 2. **AI Bot - Minimax Algorithm**

#### File
- `backend/src/utils/caroAI.js`

#### Cách sử dụng
```javascript
const CaroAI = require('./utils/caroAI');

// Khởi tạo AI
const ai = new CaroAI(15, 5); // boardSize = 15, winCondition = 5

// Lấy nước đi tốt nhất
const board = [
  [null, null, 'X', null, ...],
  ['O', null, null, null, ...],
  // ... 15x15 board
];

const bestMove = ai.getBestMove(board);
// Trả về: { row: 7, col: 8 }
```

#### Features
- Minimax với Alpha-Beta Pruning
- Heuristic evaluation
- Depth limit để tối ưu performance
- Hỗ trợ board size tùy chỉnh

---

### 3. **Profile Management**

#### Frontend Components
- **Profile.jsx** (`frontend/src/pages/Profile/Profile.jsx`)
- **Profile.css** (`frontend/src/pages/Profile/Profile.css`)

#### Features
- Hiển thị & chỉnh sửa profile (username, avatar, bio)
- Hiển thị thống kê game (tổng trận, thắng/thua, winrate)
- Xem lịch sử game gần đây
- Replay game

#### Redux Store
```javascript
// userSlice.js
import { fetchUserProfile, updateUserProfile } from './store/userSlice';

// Lấy profile
dispatch(fetchUserProfile());

// Cập nhật profile
dispatch(updateUserProfile({ 
  username: 'newname', 
  avatarUrl: 'https://...', 
  bio: 'Hello world' 
}));
```

---

### 4. **Friends Management**

#### Frontend Components
- **Friends.jsx** (`frontend/src/pages/Friends/Friends.jsx`)
- **Friends.css** (`frontend/src/pages/Friends/Friends.css`)

#### Features
- 3 tabs: Bạn bè, Lời mời, Tìm bạn
- Hiển thị trạng thái online/offline real-time
- Gửi/chấp nhận/từ chối lời mời kết bạn
- Hủy kết bạn
- Tìm kiếm theo nickname hoặc User ID

#### API Endpoints
```
GET  /api/friend              - Danh sách bạn bè
GET  /api/friend/requests     - Lời mời kết bạn
POST /api/friend/request      - Gửi yêu cầu
POST /api/friend/accept       - Chấp nhận
POST /api/friend/cancel       - Từ chối
POST /api/friend/unfriend     - Hủy kết bạn
POST /api/friend/search       - Tìm kiếm
```

#### Redux Store
```javascript
// friendSlice.js
import { 
  fetchFriendsList, 
  sendFriendRequest,
  acceptFriendRequest 
} from './store/friendSlice';

// Lấy danh sách bạn
dispatch(fetchFriendsList());

// Gửi lời mời
dispatch(sendFriendRequest(addresseeId));

// Chấp nhận lời mời
dispatch(acceptFriendRequest(requesterId));
```

---

## 🚀 Cài đặt & Chạy

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Cấu trúc File mới

### Backend
```
backend/src/
├── models/
│   ├── gameHistory.model.js  ✨ NEW
│   └── user.model.js         ✏️ Updated (thêm bio)
├── controllers/
│   └── gameHistory.controller.js  ✨ NEW
├── services/
│   └── gameHistory.service.js     ✨ NEW
├── routes/
│   └── gameHistory.routes.js      ✨ NEW
└── utils/
    └── caroAI.js                   ✨ NEW
```

### Frontend
```
frontend/src/
├── pages/
│   ├── Profile/
│   │   ├── Profile.jsx  ✨ NEW
│   │   └── Profile.css  ✨ NEW
│   └── Friends/
│       ├── Friends.jsx  ✨ NEW
│       └── Friends.css  ✨ NEW
├── store/
│   ├── userSlice.js    ✨ NEW
│   ├── friendSlice.js  ✨ NEW
│   └── index.js        ✏️ Updated
└── services/api/
    ├── userApi.js      ✨ NEW
    ├── friendApi.js    ✨ NEW
    └── index.js        ✨ NEW
```

---

## 🎨 Design Features

### Glassmorphism Effect
- Background với gradient đẹp mắt
- Backdrop blur cho card
- Smooth transitions & animations

### Responsive Design
- Mobile-first approach
- Breakpoints: 640px, 768px, 968px
- Grid layout tự động điều chỉnh

### Color Palette
- Primary: `#667eea` → `#764ba2` (Gradient)
- Success: `#48bb78`
- Danger: `#f56565`
- Online: `#48bb78`
- In Game: `#ed8936`
- Offline: `#a0aec0`

---

## 🔄 Tích hợp Socket.IO

Để cập nhật trạng thái online real-time, thêm vào socket handler:

```javascript
// Frontend - socket service
socket.on('user:status_change', ({ userId, status }) => {
  dispatch(updateOnlineStatus({ userId, status }));
});

// Backend - socket handler
io.on('connection', (socket) => {
  // When user connects
  socket.on('user:online', (userId) => {
    socket.broadcast.emit('user:status_change', { 
      userId, 
      status: 'online' 
    });
  });
  
  // When user starts game
  socket.on('game:start', (userId) => {
    socket.broadcast.emit('user:status_change', { 
      userId, 
      status: 'in_game' 
    });
  });
});
```

---

## 📊 Database Schema Updates

### User Model
```javascript
{
  // ... existing fields
  bio: { type: String, maxlength: 500, default: '' }  // ✨ NEW
}
```

### GameHistory Model
```javascript
{
  roomId: ObjectId,
  players: [{
    userId: ObjectId,
    username: String,
    symbol: String,
    isWinner: Boolean
  }],
  moves: [{
    player: String,
    position: { row: Number, col: Number },
    timestamp: Date
  }],
  winner: String,
  winnerUserId: ObjectId,
  boardSize: Number,
  gameMode: String,
  duration: Number,
  createdAt: Date
}
```

---

## 🧪 Testing

### Test API với Postman/Thunder Client

#### 1. Update Profile
```
PUT http://localhost:5000/api/user/update-profile
Headers: Authorization: Bearer <token>
Body: {
  "username": "newusername",
  "bio": "Hello, I love Caro!",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

#### 2. Search Friends
```
POST http://localhost:5000/api/friend/search
Headers: Authorization: Bearer <token>
Body: {
  "nickname": "john"
}
```

#### 3. Save Game Result
```
POST http://localhost:5000/api/history/save
Headers: Authorization: Bearer <token>
Body: {
  "roomId": "...",
  "players": [...],
  "moves": [...],
  "winner": "X",
  "winnerUserId": "..."
}
```

---

## 💡 Tips & Best Practices

1. **Performance**
   - GameHistory API có pagination (limit, skip)
   - AI depth limitation để tránh lag
   - Index database cho queries phổ biến

2. **Security**
   - Tất cả routes đều dùng `verifyToken` middleware
   - Validate input trước khi lưu DB
   - Sanitize user-generated content (bio)

3. **UX**
   - Toast notifications cho mọi action
   - Loading states cho async operations
   - Empty states khi không có data

---

## 🐛 Troubleshooting

### Issue: AI quá chậm
- Giảm `maxDepth` trong CaroAI constructor
- Giới hạn số possible moves

### Issue: Friend status không cập nhật
- Kiểm tra Socket.IO connection
- Verify emit events từ backend

### Issue: Avatar không hiển thị
- Kiểm tra CORS settings
- Dùng default avatar nếu URL invalid

---

## 📝 License

MIT

---

## 👥 Contributors

- Backend: GameHistory, AI Bot, User/Friend APIs
- Frontend: Profile, Friends pages, Redux integration
- Design: Modern UI với Glassmorphism

---

**Enjoy coding! 🚀**
