// index.js
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const gameSocket = require("./game.socket");
const chatSocket = require("./chat.socket");
const roomSocket = require("./room.socket");
const friendSocket = require("./friend.socket");

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Set io instance cho friend.service để có thể emit notifications
  const friendService = require("../services/friend.service");
  friendService.setSocketInstance(io);

  // Map để track các socket connections của mỗi user (userId -> [socketIds])
  const userSockets = new Map();

  // Middleware xác thực JWT
  io.use((socket, next) => {
    console.log("🔑 Checking token for socket:", socket.id);
    console.log("📦 Handshake auth:", socket.handshake.auth);
    console.log("📦 Handshake headers:", socket.handshake.headers);

    // Lấy token từ auth hoặc headers
    let token = socket.handshake.auth?.token || socket.handshake.headers["authorization"] || socket.handshake.headers["Authorization"];
    
    if (!token) {
      console.log("❌ No token provided in handshake");
      return next(new Error("No token provided"));
    }

    try {
      // Loại bỏ "Bearer " nếu có
      let tokenStr = token.replace("Bearer ", "").trim();
      // Loại bỏ dấu ngoặc kép nếu có
      tokenStr = tokenStr.replace(/^"(.*)"$/, '$1');
      
      if (!tokenStr || tokenStr === 'null' || tokenStr === 'undefined') {
        console.log("❌ Token is empty after processing");
        return next(new Error("Invalid token format"));
      }

      const decoded = jwt.verify(tokenStr, process.env.JWT_SECRET);

      // Lưu user info vào socket
      socket.user = {
        _id: decoded.id || decoded._id,
        username: decoded.username,
      };
      console.log("✅ Token valid for user:", decoded.username, "ID:", socket.user._id);
      next();
    } catch (err) {
      console.log("❌ Invalid token:", err.message);
      console.log("❌ Token error details:", err);
      return next(new Error("Invalid token: " + err.message));
    }
  });

  // Khi có client kết nối
  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(`✅ User connected: ${socket.id} (${socket.user.username})`);

    // Join socket vào room với userId để có thể gửi message trực tiếp đến user
    socket.join(userId);

    // Track socket của user này
    if (!userSockets.has(userId)) {
      userSockets.set(userId, []);
    }
    const userSocketList = userSockets.get(userId);
    userSocketList.push(socket.id);

    // Nếu user có nhiều hơn 2 socket connections, đóng các socket cũ
    if (userSocketList.length > 2) {
      console.log(`⚠️ User ${socket.user.username} has ${userSocketList.length} connections, closing old ones...`);
      // Giữ lại 2 socket mới nhất, đóng các socket cũ
      const socketsToClose = userSocketList.slice(0, userSocketList.length - 2);
      socketsToClose.forEach(oldSocketId => {
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
          console.log(`🔌 Closing duplicate socket: ${oldSocketId}`);
          oldSocket.disconnect(true);
        }
        // Xóa khỏi list
        const index = userSocketList.indexOf(oldSocketId);
        if (index > -1) {
          userSocketList.splice(index, 1);
        }
      });
    }

    // ---------------------------
    // Timeout & ping/pong
    // ---------------------------
    // Tăng timeout lên 15 giây để phù hợp với ping 5s/lần
    let pingTimeout = setTimeout(() => {
      console.log(`❌ User ${socket.id} timed out`);
      socket.disconnect(true);
    }, 15000);

    socket.on("ping_server", () => {
      console.log(`📡 Ping received from ${socket.id}`);
      clearTimeout(pingTimeout);
      // Reset timeout mỗi khi nhận được ping (15 giây)
      pingTimeout = setTimeout(() => {
        console.log(`❌ User ${socket.id} timed out`);
        socket.disconnect(true);
      }, 15000);
      socket.emit("pong_server", { time: Date.now() });
    });

    // ---------------------------
    // 🔥 Đăng ký các socket con
    // ---------------------------
    gameSocket(io, socket);
    chatSocket(io, socket);
    roomSocket(io, socket);
    friendSocket(io, socket);

    // Khi disconnect
    socket.on("disconnect", (reason) => {
      clearTimeout(pingTimeout);
      console.log(`❌ User disconnected: ${socket.id} (${reason})`);
      
      // Xóa socket khỏi tracking
      const userSocketList = userSockets.get(userId);
      if (userSocketList) {
        const index = userSocketList.indexOf(socket.id);
        if (index > -1) {
          userSocketList.splice(index, 1);
        }
        // Nếu không còn socket nào, xóa user khỏi map
        if (userSocketList.length === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });

  return io;
}

module.exports = initSocket;
