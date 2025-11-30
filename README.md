# Caro Online Game

Ứng dụng chơi cờ caro trực tuyến với Socket.IO realtime.

## Cấu trúc dự án

```
BaiTapLonWeb20251/
├── backend/          # Node.js + Express + Socket.IO
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   └── utils/
│   └── package.json
│
└── frontend/         # React + Redux + Socket.IO Client
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── store/
    │   └── hooks/
    └── package.json
```

## Cài đặt

### Backend

```bash
cd backend
npm install
```

Tạo file `.env`:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/caro-online
JWT_SECRET=your-secret-key-here
```

Chạy backend:
```bash
npm start
# hoặc
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Tạo file `.env`:
```
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

Chạy frontend:
```bash
npm run dev
```

## Tính năng

- ✅ Đăng ký/Đăng nhập
- ✅ Tạo phòng/Tham gia phòng
- ✅ Chơi game caro realtime
- ✅ Chat trong phòng (sắp có)
- ✅ Quản lý bạn bè (sắp có)
- ✅ Bảng xếp hạng (sắp có)

## API Endpoints

### Auth
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập

### Rooms
- `GET /api/rooms/list` - Danh sách phòng
- `POST /api/rooms/create` - Tạo phòng
- `POST /api/rooms/join` - Tham gia phòng
- `POST /api/rooms/leave` - Rời phòng

## Socket Events

### Room Events
- `join_room` - Tham gia phòng
- `leave_room` - Rời phòng
- `player_ready` - Đánh dấu sẵn sàng
- `start_game` - Bắt đầu game
- `room_update` - Cập nhật phòng
- `player_joined` - Người chơi tham gia
- `player_left` - Người chơi rời

### Game Events
- `make_move` - Đánh cờ
- `move_made` - Nước đi đã được thực hiện
- `undo_move` - Hoàn tác
- `reset_game` - Reset game
- `game_end` - Game kết thúc
- `game_start` - Game bắt đầu

## Công nghệ sử dụng

### Backend
- Node.js
- Express.js
- Socket.IO
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs

### Frontend
- React 18
- Redux Toolkit
- React Router
- Socket.IO Client
- Tailwind CSS
- Axios

## Lưu ý

- Đảm bảo MongoDB đang chạy trước khi start backend
- Cần có file `.env` với các biến môi trường cần thiết
- Token được lưu trong localStorage
- Socket connection tự động khi đăng nhập

