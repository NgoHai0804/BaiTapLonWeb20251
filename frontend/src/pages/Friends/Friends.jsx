import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { friendApi } from '../../services/api/friendApi';
import { toast } from 'react-toastify';

const Friends = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'search'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const response = await friendApi.getFriends();
      // Kiểm tra format response
      const data = response?.data || response || [];
      setFriends(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load friends error:', error);
      setFriends([]);
      // Chỉ hiển thị toast nếu không phải lỗi 404 hoặc empty
      if (error.response?.status !== 404) {
        toast.error('Không thể tải danh sách bạn bè');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const response = await friendApi.getRequests();
      const data = response?.data || response || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load requests error:', error);
      setRequests([]);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.warning('Vui lòng nhập nickname hoặc userID để tìm kiếm');
      return;
    }

    try {
      setLoading(true);
      // Luôn tìm theo nickname trước (ưu tiên nickname)
      const searchNickname = searchQuery.trim();
      const response = await friendApi.searchUser(searchNickname, null);
      const data = response?.data || response || [];
      setSearchResults(Array.isArray(data) ? data : []);
      setActiveTab('search');
      
      if (data.length === 0) {
        toast.info('Không tìm thấy người dùng nào');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      toast.error(error.response?.data?.message || 'Không thể tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await friendApi.sendRequest(userId);
      toast.success('Đã gửi lời mời kết bạn');
      loadRequests();
      // Update search results
      setSearchResults(prev => prev.map(u => 
        u._id === userId ? { ...u, friendStatus: 'pending' } : u
      ));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi lời mời');
    }
  };

  const handleAcceptRequest = async (requesterId) => {
    try {
      await friendApi.acceptRequest(requesterId);
      toast.success('Đã chấp nhận lời mời kết bạn');
      loadFriends();
      loadRequests();
    } catch (error) {
      toast.error('Không thể chấp nhận lời mời');
    }
  };

  const handleCancelRequest = async (requesterId) => {
    try {
      await friendApi.cancelRequest(requesterId);
      toast.success('Đã từ chối lời mời');
      loadRequests();
    } catch (error) {
      toast.error('Không thể từ chối lời mời');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Bạn có chắc muốn hủy kết bạn?')) return;

    try {
      await friendApi.removeFriend(friendId);
      toast.success('Đã hủy kết bạn');
      loadFriends();
    } catch (error) {
      toast.error('Không thể hủy kết bạn');
    }
  };

  const handleInviteToRoom = (friendId) => {
    // Navigate to create room with friend
    navigate('/rooms/create', { state: { inviteFriendId: friendId } });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      online: { text: 'Online', color: 'bg-green-500' },
      offline: { text: 'Offline', color: 'bg-gray-500' },
      in_game: { text: 'Đang chơi', color: 'bg-blue-500' },
    };
    const statusInfo = statusMap[status] || statusMap.offline;
    return (
      <span className={`px-2 py-1 rounded-full text-xs text-white ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Bạn bè</h1>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo nickname hoặc userID..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Tìm kiếm
          </button>
        </div>
      </form>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'friends'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Bạn bè ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'requests'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Lời mời ({requests.length})
        </button>
        {searchResults.length > 0 && (
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'search'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Kết quả tìm kiếm ({searchResults.length})
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {activeTab === 'friends' && (
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Bạn chưa có bạn bè nào. Hãy tìm kiếm và gửi lời mời kết bạn!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <div
                    key={friend._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {friend.avatarUrl ? (
                          <img src={friend.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-400">
                            {friend.nickname?.[0]?.toUpperCase() || friend.username?.[0]?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{friend.nickname || friend.username}</div>
                        <div className="text-sm text-gray-500">@{friend.username}</div>
                      </div>
                      {getStatusBadge(friend.status)}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => navigate(`/profile/${friend._id}`)}
                        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        title="Xem profile"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => navigate(`/chat/${friend._id}`)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Nhắn tin
                      </button>
                      <button
                        onClick={() => handleInviteToRoom(friend._id)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Mời chơi
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(friend._id)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Hủy kết bạn
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="p-6">
            {requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Không có lời mời kết bạn nào
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request._id}
                    className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {request.requester?.avatarUrl ? (
                          <img src={request.requester.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-400">
                            {request.requester?.nickname?.[0]?.toUpperCase() || request.requester?.username?.[0]?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{request.requester?.nickname || request.requester?.username}</div>
                        <div className="text-sm text-gray-500">@{request.requester?.username}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/profile/${request.requester._id}`)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        title="Xem profile"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => handleAcceptRequest(request.requester._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Chấp nhận
                      </button>
                      <button
                        onClick={() => handleCancelRequest(request.requester._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="p-6">
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy người dùng nào
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-400">
                            {user.nickname?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{user.nickname || user.username}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                        {user.friendStatus && (
                          <div className="text-xs text-gray-400 mt-1">
                            {user.friendStatus === 'accepted' && 'Đã là bạn bè'}
                            {user.friendStatus === 'pending' && 'Đã gửi lời mời'}
                            {user.friendStatus === 'none' && 'Chưa kết bạn'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => navigate(`/profile/${user._id}`)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        title="Xem profile"
                      >
                        Profile
                      </button>
                      {user.friendStatus === 'accepted' ? (
                        <span className="px-4 py-2 text-gray-600">Đã là bạn bè</span>
                      ) : user.friendStatus === 'pending' ? (
                        <span className="px-4 py-2 text-yellow-600">Đã gửi lời mời</span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user._id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Kết bạn
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
