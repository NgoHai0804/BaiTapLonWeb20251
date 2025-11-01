// friend.routes.js
// Quản lý quan hệ bạn bè.

// Chức năng chính:
// 1. Lấy danh sách bạn bè  RESTful
// 2. Gửi lời mời kết bạn RESTful

// 4. Lấy danh sách lời mời RESTful
// 5 Chấp nhận/ Hủy lời mời RESTful
// 6. Tìm bạn bè theo username RESTful
// 7. Hủy kết bạn RESTful


const express = require('express');
const router = express.Router();
const FriendController = require('../controllers/friend.controller');


// Middleware xác thực (ví dụ)
const verifyToken = require('../middlewares/auth.middleware');

// Tất cả route đều yêu cầu đăng nhập
router.use(verifyToken);

// Lấy danh sách bạn bè
router.get('/', FriendController.getFriends);

// Gửi lời mời kết bạn
router.post('/request', FriendController.sendRequest);

// Lấy danh sách lời mời kết bạn
router.get('/requests', FriendController.getRequests);

// Chấp nhận lời mời
router.post('/accept', FriendController.acceptRequest);

// Hủy lời mời / từ chối kết bạn
router.post('/cancel', FriendController.cancelRequest);

// Tìm bạn theo username
router.post('/search', FriendController.searchUser);

// Hủy kết bạn
router.post('/unfriend', FriendController.removeFriend);

module.exports = router;
