import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { loginUser, registerUser, logoutUser, getCurrentUser, clearError } from '../store/authSlice'

/**
 * Custom hook để quản lý authentication
 * @returns {Object} Auth state và methods
 */
export const useAuth = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { user, token, isAuthenticated, loading, error } = useSelector((state) => state.auth)

    /**
     * Đăng nhập
     * @param {Object} credentials - { email/username, password }
     */
    const login = async (credentials) => {
        try {
            const result = await dispatch(loginUser(credentials)).unwrap()
            navigate('/lobby') // Chuyển đến trang lobby sau khi đăng nhập thành công
            return result
        } catch (error) {
            throw error
        }
    }

    /**
     * Đăng ký
     * @param {Object} userData - { username, email, password, ... }
     */
    const register = async (userData) => {
        try {
            const result = await dispatch(registerUser(userData)).unwrap()
            navigate('/lobby') // Có thể chuyển đến login hoặc tự động login
            return result
        } catch (error) {
            throw error
        }
    }

    /**
     * Đăng xuất
     */
    const logout = async () => {
        await dispatch(logoutUser())
        navigate('/auth/login')
    }

    /**
     * Lấy thông tin user hiện tại từ server
     */
    const refreshUser = async () => {
        try {
            await dispatch(getCurrentUser()).unwrap()
        } catch (error) {
            console.error('Failed to refresh user:', error)
        }
    }

    /**
     * Xóa error
     */
    const clearAuthError = () => {
        dispatch(clearError())
    }

    return {
        // State
        user,
        token,
        isAuthenticated,
        loading,
        error,

        // Methods
        login,
        register,
        logout,
        refreshUser,
        clearAuthError,
    }
}

export default useAuth