// response.js

// Chuẩn hóa cấu trúc response API.

// Chức năng:
// Tạo hàm success(res, data, message) → trả về { status: 'success', message, data }.
// Tạo hàm error(res, message, statusCode) → trả về { status: 'error', message }.
// Giúp tất cả API có format thống nhất.

// response.js
module.exports = {
  success(res, data = {}, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  },

  error(res, message = "Internal Server Error", statusCode = 500, data = {}) {
    return res.status(statusCode).json({
      success: false,
      message,
      data,
    });
  },
};
