// game.socket.js

// Xử lý toàn bộ sự kiện trong ván Caro.

// Chức năng:

// Lắng nghe sự kiện "move" → kiểm tra hợp lệ và phát cho đối thủ.

// Xác định kết quả (thắng/thua/hòa).

// Xử lý "undo", "redo", "restart" nếu cả hai bên đồng ý.

// Gọi aiBot.service nếu đối thủ là bot.

// Cập nhật điểm hoặc lịch sử sau mỗi trận.