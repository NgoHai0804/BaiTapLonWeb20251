// gameSocket.js

// Xử lý các sự kiện game cụ thể: nước đi, thắng thua, vào phòng, rời phòng,...

// Nhiệm vụ:

// Lắng nghe các event từ server:

// "playerMove" – nhận nước đi đối phương.

// "playerJoin" – có người vào phòng.

// "playerLeave" – có người thoát.

// "gameOver" – kết thúc trận.

// Gửi dữ liệu lên server:

// "makeMove" – gửi nước đi.

// "startGame", "undoRequest", "redoRequest"…

// Gợi ý cấu trúc:

// import socket from "./socketClient";

// export const gameSocket = {
//   joinRoom: (roomId) => socket.emit("joinRoom", { roomId }),
//   leaveRoom: (roomId) => socket.emit("leaveRoom", { roomId }),
//   sendMove: (data) => socket.emit("makeMove", data),
//   onMove: (cb) => socket.on("playerMove", cb),
//   onGameOver: (cb) => socket.on("gameOver", cb),
//   offAll: () => socket.off(),
// };


// Lưu ý:

// onX dùng để đăng ký callback (listener).

// offX hoặc offAll để gỡ event khi unmount component (tránh memory leak).

// Có thể tách riêng event cho chatSocket, friendSocket nếu muốn chia nhỏ.