// chatApi.js

// Làm việc với tin nhắn — chat trong phòng hoặc chat riêng giữa 2 người.

// Nhiệm vụ:

// Lấy lịch sử chat (GET /chat/history?roomId=... hoặc GET /chat/private?userId=...).

// Lưu tin nhắn (nếu backend có lưu DB) (POST /chat/save).

// Đánh dấu tin nhắn đã đọc (POST /chat/read).

// Gợi ý cấu trúc:

// chatApi = {
//   getRoomChat(roomId),
//   getPrivateChat(userId),
//   sendMessage(data),
//   markAsRead(chatId)
// }