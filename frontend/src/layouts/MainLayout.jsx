import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useNotifications } from '../hooks/useNotifications';
import NotificationBell from '../components/Navbar/NotificationBell';
import { roomApi } from '../services/api/roomApi';

const MainLayout = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasCheckedRoom, setHasCheckedRoom] = useState(false);
  useSocket(); // Initialize socket connection
  useNotifications(); // Initialize notifications listener

  // Kiểm tra xem user có đang trong phòng nào không khi đăng nhập
  useEffect(() => {
    const checkUserRoom = async () => {
      // Chỉ kiểm tra nếu đã đăng nhập, chưa kiểm tra, và không đang ở trang game
      if (!isAuthenticated || hasCheckedRoom || location.pathname.startsWith('/game/')) {
        return;
      }

      try {
        const result = await roomApi.checkUserRoom();
        
        if (result?.inRoom && result?.room?._id) {
          // User đang ở trong phòng, tự động chuyển đến phòng đó
          console.log('User đang ở trong phòng, tự động chuyển đến phòng:', result.room._id);
          navigate(`/game/${result.room._id}`, { replace: true });
        }
      } catch (error) {
        // Lỗi không quan trọng, chỉ log ra
        console.error('Lỗi khi kiểm tra phòng của user:', error);
      } finally {
        setHasCheckedRoom(true);
      }
    };

    checkUserRoom();
  }, [isAuthenticated, hasCheckedRoom, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600">
                Caro Online
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <NotificationBell />
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {user.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt="Avatar" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-lg font-bold text-gray-600">
                          {(user.nickname || user.username)?.[0]?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-700">Xin chào, {user.nickname || user.username}</span>
                  </div>
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
        {/* Sidebar - Ẩn khi ở trang game */}
        {!location.pathname.startsWith('/game/') && (
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
        )}

        {/* Main Content */}
        <main className={location.pathname.startsWith('/game/') ? 'flex-1 w-full' : 'flex-1'}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
