import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userApi } from '../../services/api/userApi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    avatarUrl: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userApi.getProfile();
      if (data) {
        setProfile(data);
        setFormData({
          nickname: data.nickname || '',
          avatarUrl: data.avatarUrl || '',
        });
      }
    } catch (error) {
      toast.error('Không thể tải thông tin profile');
      console.error('Lỗi khi tải profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user, loadProfile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updated = await userApi.updateProfile(formData);
      setProfile(updated);
      updateUser(updated);
      setEditing(false);
      toast.success('Cập nhật profile thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật profile thất bại');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    try {
      await userApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Đổi mật khẩu thành công');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
    }
  };

  const getGameStats = () => {
    if (!profile?.gameStats || profile.gameStats.length === 0) {
      return { totalGames: 0, totalWin: 0, totalLose: 0, score: 0 };
    }
    const caroStats = profile.gameStats.find(s => s.gameId === 'caro') || profile.gameStats[0];
    return {
      totalGames: caroStats.totalGames || 0,
      totalWin: caroStats.totalWin || 0,
      totalLose: caroStats.totalLose || 0,
      score: caroStats.score || 0,
    };
  };

  const stats = getGameStats();
  const winRate = stats.totalGames > 0 ? ((stats.totalWin / stats.totalGames) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Hồ sơ cá nhân</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center text-gray-500">
            Không thể tải thông tin profile. Vui lòng thử lại sau.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Hồ sơ cá nhân</h1>

      <div className="bg-white rounded-lg shadow-lg p-6">
        {!editing ? (
          <div>
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-gray-400">
                    {profile?.nickname?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profile?.nickname || profile?.username}</h2>
                {profile?.email && <p className="text-gray-500 text-sm">{profile.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalGames}</div>
                <div className="text-sm text-gray-600">Tổng ván</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.totalWin}</div>
                <div className="text-sm text-gray-600">Thắng</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.totalLose}</div>
                <div className="text-sm text-gray-600">Thua</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{winRate}%</div>
                <div className="text-sm text-gray-600">Tỷ lệ thắng</div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">Điểm số</h3>
              <div className="text-3xl font-bold text-blue-600">{stats.score}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Chỉnh sửa profile
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
                    logout(); // logout đã có logic disconnect socket và navigate
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nickname</label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={5}
                  maxLength={15}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Avatar URL</label>
                <input
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      nickname: profile?.nickname || '',
                      avatarUrl: profile?.avatarUrl || '',
                    });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Change Password Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Đổi mật khẩu</h2>
            <button
              onClick={() => {
                setShowChangePassword(!showChangePassword);
                if (showChangePassword) {
                  // Reset form khi đóng
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                }
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {showChangePassword ? 'Ẩn' : 'Đổi mật khẩu'}
            </button>
          </div>
          {showChangePassword && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={8}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Đổi mật khẩu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
