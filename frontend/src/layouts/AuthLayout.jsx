import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Layout cho các trang authentication (Login, Register, ForgotPassword)
 * Nếu user đã đăng nhập, redirect về trang chủ
 */
const AuthLayout = () => {
    const { isAuthenticated } = useAuth()

    // Nếu đã đăng nhập, redirect về lobby
    if (isAuthenticated) {
        return <Navigate to="/lobby" replace />
    }

    return (
        <div className="auth-layout min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
            <div className="auth-container w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Logo/Brand */}
                    <div className="p-8 text-center bg-gradient-to-r from-blue-500 to-purple-600">
                        <h1 className="text-3xl font-bold text-white mb-2">🎮 Caro Online</h1>
                        <p className="text-blue-100">Chơi cờ caro cùng bạn bè</p>
                    </div>

                    {/* Form Content */}
                    <div className="p-8">
                        <Outlet />
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-white text-sm">
                        © 2024 Caro Online. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default AuthLayout