import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userApi } from '../../services/api/userApi';
import { friendApi } from '../../services/api/friendApi';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';

const ViewProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState('none'); // 'none', 'pending', 'accepted'
  const [isRequester, setIsRequester] = useState(false); // true nếu current user là người gửi lời mời
  const [isAddressee, setIsAddressee] = useState(false); // true nếu current user là người nhận lời mời
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  useEffect(() => {
    if (userId) {
      loadProfile();
      checkFriendStatus();
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await userApi.getUserProfile(userId);
      setProfile(data);
    } catch (error) {
      toast.error('Không thể tải thông tin profile');
      console.error('Lỗi khi tải profile:', error);
      navigate('/friends');
    } finally {
      setLoading(false);
    }
  };

  const checkFriendStatus = async () => {
    try {
      const response = await friendApi.searchUser(null, userId);
      const users = response?.data || response || [];
      if (users.length > 0) {
        const userData = users[0];
        if (userData.friendStatus) {
          setFriendStatus(userData.friendStatus);
        }
        // Kiểm tra ai là người gửi, ai là người nhận
        setIsRequester(userData.isRequester || false);
        setIsAddressee(userData.isAddressee || false);
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái bạn bè:', error);
    }
  };

  const handleSendRequest = async () => {
    try {
      setIsLoadingStatus(true);
      await friendApi.sendRequest(userId);
      setFriendStatus('pending');
      setIsRequester(true); // Current user là người gửi
      setIsAddressee(false);
      toast.success('Đã gửi lời mời kết bạn');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi lời mời');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      setIsLoadingStatus(true);
      // userId là người gửi lời mời (requester), current user là người nhận (addressee)
      await friendApi.acceptRequest(userId);
      setFriendStatus('accepted');
      setIsRequester(false);
      setIsAddressee(false);
      toast.success('Đã chấp nhận lời mời kết bạn');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể chấp nhận lời mời');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleChat = () => {
    navigate(`/chat/${userId}`);
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
  const isMyProfile = currentUser?.id === userId || currentUser?._id === userId;

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8">
        <div className="text-center text-red-500">Không tìm thấy profile</div>
        <button
          onClick={() => navigate('/friends')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Quay lại
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Hồ sơ người dùng</h1>

      <div className="bg-white rounded-lg shadow-lg p-6">
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
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{profile?.nickname || profile?.username}</h2>
            {profile?.email && <p className="text-gray-500 text-sm">{profile.email}</p>}
          </div>
          {!isMyProfile && (
            <div className="flex gap-2">
              {friendStatus === 'accepted' ? (
                <>
                  <button
                    onClick={handleChat}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Nhắn tin
                  </button>
                </>
              ) : friendStatus === 'pending' && isAddressee ? (
                // Chỉ hiển thị nút "Chấp nhận" khi current user là người nhận lời mời
                <button
                  onClick={handleAcceptRequest}
                  disabled={isLoadingStatus}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Chấp nhận lời mời
                </button>
              ) : friendStatus === 'pending' && isRequester ? (
                // Nếu current user là người gửi, hiển thị trạng thái "Đã gửi lời mời"
                <button
                  disabled
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                >
                  Đã gửi lời mời
                </button>
              ) : (
                <button
                  onClick={handleSendRequest}
                  disabled={isLoadingStatus}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Kết bạn
                </button>
              )}
            </div>
          )}
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

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Điểm số</h3>
          <div className="text-3xl font-bold text-blue-600">{stats.score}</div>
        </div>
      </div>
    </div>
  );
};

export default ViewProfile;

