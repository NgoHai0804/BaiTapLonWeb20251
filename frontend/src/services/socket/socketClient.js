// socketClient.js

// File khởi tạo và quản lý kết nối Socket.IO duy nhất trong toàn ứng dụng.

// Nhiệm vụ:

// Tạo socket client với server (io("https://server-url.com")).

// Truyền token xác thực (auth: { token: ... }).

// Tự động reconnect nếu mất kết nối.

// Export instance socket để module khác sử dụng.

// Gợi ý cấu trúc:

// import { io } from "socket.io-client";

// const socket = io(import.meta.env.VITE_API_URL, {
//   auth: { token: localStorage.getItem("token") },
//   transports: ["websocket"],
//   reconnectionAttempts: 5,
//   reconnectionDelay: 2000,
// });

// export default socket;


// Lưu ý:

// File này chỉ chạy một lần, tránh tạo nhiều kết nối trùng.

// Có thể thêm event handler chung (như "connect", "disconnect", "error").