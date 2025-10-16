// GameLayout.jsx

// Mục đích: Dùng riêng cho phòng chơi (GameRoomPage).

// Đặc điểm:

// Fullscreen layout, không sidebar.

// Chứa GameBoard, PlayerList, ChatBox, Timer, Button (Undo/Redo).

// Có thể có background động hoặc hiệu ứng âm thanh.

// Thành phần chính:

// <GameBoard /> (Canvas) ở trung tâm.

// <PlayerList /> hiển thị người chơi 2–4 người.

// <ChatBox /> dock bên phải (hoặc dưới tuỳ thiết kế).

// Thanh điều khiển nhỏ (Menu, Quit, Settings).

// 📝 Sơ đồ bố cục minh họa

// +---------------------------------------------------------------+
// | [ PlayerList ]                Game Board (Canvas)             |
// |                           (animation, sound, moves)           |
// |---------------------------------------------------------------|
// | ChatBox (bottom / side)   |  Undo | Redo | Exit Room          |
// +---------------------------------------------------------------+