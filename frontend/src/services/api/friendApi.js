// friendApi.js

// Quản lý danh sách bạn bè, lời mời, trạng thái online/offline.

// Nhiệm vụ:

// Lấy danh sách bạn bè (GET /friends).

// Gửi lời mời kết bạn (POST /friends/invite).

// Chấp nhận hoặc từ chối lời mời (POST /friends/respond).

// Xóa bạn (DELETE /friends/:id).

// Kiểm tra trạng thái online (GET /friends/status hoặc qua socket).

// Gợi ý cấu trúc:

// friendApi = {
//   getFriends(),
//   inviteFriend(userId),
//   respondInvite(inviteId, status),
//   removeFriend(userId)
// }