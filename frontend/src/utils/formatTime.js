// formatTime.js

// Định dạng thời gian, dùng cho timer, thời gian chơi, thời điểm chat.

// Nhiệm vụ chính:

// Chuyển đổi thời gian dạng giây → mm:ss.

// Hiển thị thời gian tương đối (“5 phút trước”, “vừa xong”).

// Format timestamp từ server (ISO 8601) thành giờ địa phương.

// Ví dụ công dụng:

// Hiển thị thời gian lượt đi còn lại trong Game.

// Format thời điểm gửi tin nhắn trong ChatBox.

// Hàm gợi ý:

// formatCountdown(seconds);   // "02:15"
// formatChatTime(timestamp);  // "10:35 AM" hoặc "5 minutes ago"