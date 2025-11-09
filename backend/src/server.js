// server.js

// Điểm khởi động chính của server

// Nhiệm vụ:

// Import app

// Tạo HTTP server

// Gắn Socket.IO vào HTTP server

// Lắng nghe cổng (process.env.PORT)

// Log trạng thái khi server khởi động thành công

const app = require("./app");
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
