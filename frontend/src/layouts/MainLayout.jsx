import { Outlet, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { FiHome, FiUsers, FiMessageSquare, FiUser, FiSettings, FiLogOut } from 'react-icons/fi'

/**
 * Layout chính cho các trang đã đăng nhập
 * Bao gồm Navbar và Sidebar
 */
const MainLayout = () => {
    const { isAuthenticated, user, logout } = useAuth()

    // Nếu chưa đăng nhập, redirect về login
    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />
    }

    return (
        <div className="main-layout min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                🎮 Caro Online
                            </h1>
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center gap-4">
                            <span className="text-gray-700 font-medium">
                                Xin chào, {user?.username || user?.email}
                            </span>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                <FiLogOut />
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content with Sidebar */}
            <div className="flex pt-16">
                {/* Sidebar */}
                <aside className="w-64 bg-white shadow-lg h-[calc(100vh-4rem)] fixed left-0 top-16">
                    <nav className="p-4 space-y-2">
                        <SidebarLink to="/lobby" icon={<FiHome />} label="Lobby" />
                        <SidebarLink to="/friends" icon={<FiUsers />} label="Bạn bè" />
                        <SidebarLink to="/chat" icon={<FiMessageSquare />} label="Tin nhắn" />
                        <SidebarLink to="/profile" icon={<FiUser />} label="Hồ sơ" />
                        <SidebarLink to="/settings" icon={<FiSettings />} label="Cài đặt" />
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 ml-64 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

// Sidebar Link Component
const SidebarLink = ({ to, icon, label }) => {
    return (
        <Link
            to={to}
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors group"
        >
            <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
            <span className="font-medium">{label}</span>
        </Link>
    )
}

export default MainLayout