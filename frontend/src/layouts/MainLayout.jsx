import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useNotifications } from '../hooks/useNotifications';
import NotificationBell from '../components/Navbar/NotificationBell';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useSocket(); // Initialize socket connection
  useNotifications(); // Initialize notifications listener

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600">
                🎮 Caro Online
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <NotificationBell />
                  <span className="text-gray-700">Xin chào, {user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  to="/auth/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar and Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md min-h-screen">
          <nav className="p-4 space-y-2">
            <Link
              to="/lobby"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              🏠 Lobby
            </Link>
            <Link
              to="/friends"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              👥 Bạn bè
            </Link>
            <Link
              to="/profile"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              👤 Hồ sơ
            </Link>
            <Link
              to="/leaderboard"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              🏆 Bảng xếp hạng
            </Link>
            <Link
              to="/settings"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ⚙️ Cài đặt
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
