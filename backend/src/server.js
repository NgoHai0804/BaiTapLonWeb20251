// server.js
// Điểm khởi động chính của server
// nodemon scr/server.js

// Nhiệm vụ:
// - Import app
// - Tạo HTTP server
// - Gắn Socket.IO vào HTTP server
// - Lắng nghe cổng (process.env.PORT)
// - Log trạng thái khi server khởi động thành công

const http = require("http");
const app = require("./app");
const initSocket = require("./sockets");

const PORT = process.env.PORT || 3000;

// Tạo HTTP server
const server = http.createServer(app);

// Khởi tạo Socket.IO
const io = initSocket(server);

// Lắng nghe port
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
