import axiosInstance from './axios'

const authApi = {
    // Đăng ký tài khoản mới
    register: async (data) => {
        return await axiosInstance.post('/api/auth/register', data)
    },

    // Đăng nhập
    login: async (data) => {
        return await axiosInstance.post('/api/auth/login', data)
    },

    // Đăng xuất
    logout: async () => {
        return await axiosInstance.post('/api/auth/logout')
    },

    // Lấy thông tin user hiện tại
    getCurrentUser: async () => {
        return await axiosInstance.get('/api/auth/me')
    },

    // Quên mật khẩu - gửi email
    forgotPassword: async (email) => {
        return await axiosInstance.post('/api/auth/forgot-password', { email })
    },

    // Reset mật khẩu với token
    resetPassword: async (token, newPassword) => {
        return await axiosInstance.post('/api/auth/reset-password', {
            token,
            newPassword,
        })
    },
}

export default authApi
