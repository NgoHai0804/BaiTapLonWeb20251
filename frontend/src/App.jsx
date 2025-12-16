import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'

// Auth Pages
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import AuthDebugPanel from './components/AuthDebugPanel'

// Placeholder components for other pages
const LobbyPage = () => (
    <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">🎮 Lobby</h1>
        <p className="text-gray-600 mb-6">Danh sách phòng chơi sẽ hiển thị ở đây</p>

        {/* Auth Debug Panel - Remove in production */}
        <div className="mt-8">
            <AuthDebugPanel />
        </div>
    </div>
)

const FriendsPage = () => (
    <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">👥 Bạn bè</h1>
        <p className="text-gray-600">Danh sách bạn bè sẽ hiển thị ở đây</p>
    </div>
)

const ChatPage = () => (
    <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">💬 Tin nhắn</h1>
        <p className="text-gray-600">Tin nhắn sẽ hiển thị ở đây</p>
    </div>
)

const ProfilePage = () => (
    <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">👤 Hồ sơ</h1>
        <p className="text-gray-600">Thông tin cá nhân sẽ hiển thị ở đây</p>
    </div>
)

const SettingsPage = () => (
    <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">⚙️ Cài đặt</h1>
        <p className="text-gray-600">Cài đặt sẽ hiển thị ở đây</p>
    </div>
)

const NotFoundPage = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-8">Trang không tồn tại</p>
            <a
                href="/lobby"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Về trang chủ
            </a>
        </div>
    </div>
)

function App() {
    return (
        <>
            <Routes>
                {/* Auth Routes */}
                <Route path="/auth" element={<AuthLayout />}>
                    <Route index element={<Navigate to="/auth/login" replace />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                </Route>

                {/* Protected Main Routes */}
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<Navigate to="/lobby" replace />} />
                    <Route path="lobby" element={<LobbyPage />} />
                    <Route path="friends" element={<FriendsPage />} />
                    <Route path="chat" element={<ChatPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* 404 Not Found */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>

            {/* Toast Notifications */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </>
    )
}

export default App