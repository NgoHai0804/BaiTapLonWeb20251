// soundManager.js

// Quản lý và phát hiệu ứng âm thanh trong toàn hệ thống (click, win, lose, chat,…).

// Nhiệm vụ chính:

// Load và quản lý file âm thanh trong /public/assets/sounds/.

// Hàm phát âm thanh theo sự kiện (playMove, playWin, playLose, playMessage).

// Có thể bật/tắt âm thanh toàn cục (qua Redux hoặc localStorage).

// Tránh lặp âm thanh nếu spam nhiều sự kiện.

// Ví dụ công dụng:

// Khi người chơi đánh cờ, thắng/thua, chat mới đến, hoặc người chơi vào phòng.

// Hàm gợi ý:

// playSound("move");
// playSound("win");
// toggleMute();       // Bật/tắt âm thanh
// setVolume(0.5);     // Giảm âm lượng