// roomApi.js

// Quản lý các phòng chơi (rooms) — tương tác chính trong hệ thống game.

// Nhiệm vụ:

// Lấy danh sách phòng (GET /rooms).

// Tạo phòng mới (POST /rooms).

// Tham gia phòng (POST /rooms/join).

// Thoát phòng (POST /rooms/leave).

// Cập nhật trạng thái phòng (bắt đầu game, kết thúc,…).

// Gợi ý cấu trúc:

// roomApi = {
//   getRooms(params),
//   createRoom(data),
//   joinRoom(id, password),
//   leaveRoom(id),
//   startGame(id)
// }