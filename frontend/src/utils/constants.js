// ⚙️ constants.js

// Lưu trữ biến cố định (global constants) dùng toàn dự án, để tránh “magic number/string” trong code.

// Nhiệm vụ chính:

// Cấu hình chung cho gameplay (kích thước bàn, thời gian giới hạn, icon, màu…).

// Danh sách event Socket.IO để thống nhất giữa frontend & backend.

// Đường dẫn API / endpoint / cài đặt mặc định.

// Ví dụ nội dung:

// export const BOARD_SIZE = 15;
// export const TIME_LIMIT = 30; // giây cho mỗi lượt
// export const MAX_PLAYERS = 4;

// export const SOCKET_EVENTS = {
//   JOIN_ROOM: "joinRoom",
//   PLAYER_MOVE: "playerMove",
//   GAME_OVER: "gameOver",
//   CHAT_MESSAGE: "chatMessage",
// };