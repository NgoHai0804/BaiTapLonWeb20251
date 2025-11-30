// friend.socket.js
// Quản lý trạng thái online và lời mời bạn bè realtime.

// Chức năng:
// Thông báo "friend:online" / "friend:offline".
// Xử lý "friend:invite", "friend:accept", "friend:cancel".
// Cập nhật trạng thái bạn bè ngay lập tức trên giao diện người dùng.
// Mời vào phòng socket

// friend.socket.js
module.exports = function friendSocket(io, socket) {
  socket.on("add_friend", ({ userId, friendId }) => {
    // Xử lý logic thêm bạn bè
    console.log(`${userId} muốn kết bạn với ${friendId}`);
  });
};
