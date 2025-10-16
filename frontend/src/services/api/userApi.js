// userApi.js

// Xử lý mọi yêu cầu liên quan đến người dùng: đăng ký, đăng nhập, hồ sơ cá nhân.

// Nhiệm vụ:

// Gửi request đăng ký (POST /auth/register).

// Gửi request đăng nhập (POST /auth/login).

// Lấy thông tin người dùng (GET /user/profile).

// Cập nhật thông tin hoặc avatar (PUT /user/profile).

// Sử dụng:

// const res = await userApi.login({ email, password });


// Gợi ý cấu trúc:

// userApi = {
//   login(data),
//   register(data),
//   getProfile(),
//   updateProfile(data),
//   changePassword(data)
// }