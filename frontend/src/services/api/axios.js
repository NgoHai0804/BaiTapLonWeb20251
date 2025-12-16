import axios from 'axios'

// Tạo axios instance với base URL
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor - Thêm token vào header
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor - Xử lý lỗi global
axiosInstance.interceptors.response.use(
    (response) => {
        return response.data
    },
    (error) => {
        if (error.response) {
            // Server trả về lỗi
            const { status, data } = error.response

            if (status === 401) {
                // Token hết hạn hoặc không hợp lệ
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                window.location.href = '/auth/login'
            }

            return Promise.reject(data)
        } else if (error.request) {
            // Request được gửi nhưng không nhận được response
            return Promise.reject({
                message: 'Không thể kết nối đến server',
            })
        } else {
            // Lỗi khác
            return Promise.reject({
                message: error.message,
            })
        }
    }
)

export default axiosInstance
