import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchFriendsList,
    fetchFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    cancelFriendRequest,
    unfriend,
    searchUsers,
    clearSearchResults,
    clearActionSuccess,
    clearFriendError,
    updateOnlineStatus
} from '../../store/friendSlice';
import { toast } from 'react-toastify';
import { FaUserPlus, FaUserTimes, FaCheck, FaTimes, FaSearch, FaCircle } from 'react-icons/fa';
import './Friends.css';

const Friends = () => {
    const dispatch = useDispatch();
    const {
        friends,
        requests,
        searchResults,
        onlineStatuses,
        loading,
        error,
        actionSuccess
    } = useSelector((state) => state.friend);

    const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'requests' | 'search'
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('nickname'); // 'nickname' | 'userID'

    useEffect(() => {
        dispatch(fetchFriendsList());
        dispatch(fetchFriendRequests());
    }, [dispatch]);

    useEffect(() => {
        if (actionSuccess) {
            toast.success('Thao tác thành công!');
            dispatch(clearActionSuccess());
            dispatch(fetchFriendsList());
            dispatch(fetchFriendRequests());
        }
    }, [actionSuccess, dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearFriendError());
        }
    }, [error, dispatch]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            toast.warning('Vui lòng nhập thông tin tìm kiếm');
            return;
        }

        const searchData = searchType === 'nickname'
            ? { nickname: searchQuery }
            : { userID: searchQuery };

        dispatch(searchUsers(searchData));
    };

    const handleSendRequest = (addresseeId) => {
        dispatch(sendFriendRequest(addresseeId));
    };

    const handleAcceptRequest = (requesterId) => {
        dispatch(acceptFriendRequest(requesterId));
    };

    const handleCancelRequest = (requesterId) => {
        dispatch(cancelFriendRequest(requesterId));
    };

    const handleUnfriend = (friendId) => {
        if (window.confirm('Bạn có chắc muốn hủy kết bạn?')) {
            dispatch(unfriend(friendId));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online':
                return '#48bb78';
            case 'in_game':
                return '#ed8936';
            case 'offline':
            default:
                return '#a0aec0';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'online':
                return 'Trực tuyến';
            case 'in_game':
                return 'Đang chơi';
            case 'offline':
            default:
                return 'Không trực tuyến';
        }
    };

    return (
        <div className="friends-container">
            <div className="friends-header">
                <h1>Bạn bè</h1>
            </div>

            {/* Tabs */}
            <div className="friends-tabs">
                <button
                    className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    Bạn bè ({friends.length})
                </button>
                <button
                    className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    Lời mời ({requests.length})
                </button>
                <button
                    className={`tab ${activeTab === 'search' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('search');
                        dispatch(clearSearchResults());
                    }}
                >
                    Tìm bạn
                </button>
            </div>

            {/* Content */}
            <div className="friends-content">
                {/* Friends List Tab */}
                {activeTab === 'friends' && (
                    <div className="tab-content">
                        {friends.length === 0 ? (
                            <div className="empty-state">
                                <p>Bạn chưa có bạn bè nào</p>
                                <button
                                    className="btn-primary"
                                    onClick={() => setActiveTab('search')}
                                >
                                    Tìm bạn bè
                                </button>
                            </div>
                        ) : (
                            <div className="friends-grid">
                                {friends.map((friend) => {
                                    const friendData = friend.requester?._id === friend.addressee?._id
                                        ? friend.addressee
                                        : friend.requester;

                                    const status = onlineStatuses[friendData._id] || 'offline';

                                    return (
                                        <div key={friend._id} className="friend-card">
                                            <div className="friend-avatar-wrapper">
                                                <img
                                                    src={friendData.avatarUrl || '/default-avatar.png'}
                                                    alt={friendData.nickname}
                                                    className="friend-avatar"
                                                />
                                                <FaCircle
                                                    className="status-indicator"
                                                    style={{ color: getStatusColor(status) }}
                                                />
                                            </div>
                                            <div className="friend-info">
                                                <h3>{friendData.nickname}</h3>
                                                <p className="friend-username">@{friendData.username}</p>
                                                <p className="friend-status" style={{ color: getStatusColor(status) }}>
                                                    {getStatusText(status)}
                                                </p>
                                            </div>
                                            <button
                                                className="btn-unfriend"
                                                onClick={() => handleUnfriend(friendData._id)}
                                            >
                                                <FaUserTimes /> Hủy kết bạn
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Requests Tab */}
                {activeTab === 'requests' && (
                    <div className="tab-content">
                        {requests.length === 0 ? (
                            <div className="empty-state">
                                <p>Không có lời mời kết bạn mới</p>
                            </div>
                        ) : (
                            <div className="requests-list">
                                {requests.map((request) => (
                                    <div key={request._id} className="request-card">
                                        <img
                                            src={request.requester.avatarUrl || '/default-avatar.png'}
                                            alt={request.requester.nickname}
                                            className="request-avatar"
                                        />
                                        <div className="request-info">
                                            <h3>{request.requester.nickname}</h3>
                                            <p>@{request.requester.username}</p>
                                            <span className="request-time">
                                                {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        <div className="request-actions">
                                            <button
                                                className="btn-accept"
                                                onClick={() => handleAcceptRequest(request.requester._id)}
                                            >
                                                <FaCheck /> Chấp nhận
                                            </button>
                                            <button
                                                className="btn-cancel"
                                                onClick={() => handleCancelRequest(request.requester._id)}
                                            >
                                                <FaTimes /> Từ chối
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Search Tab */}
                {activeTab === 'search' && (
                    <div className="tab-content">
                        <form className="search-form" onSubmit={handleSearch}>
                            <div className="search-type-selector">
                                <button
                                    type="button"
                                    className={`type-btn ${searchType === 'nickname' ? 'active' : ''}`}
                                    onClick={() => setSearchType('nickname')}
                                >
                                    Tên hiển thị
                                </button>
                                <button
                                    type="button"
                                    className={`type-btn ${searchType === 'userID' ? 'active' : ''}`}
                                    onClick={() => setSearchType('userID')}
                                >
                                    User ID
                                </button>
                            </div>
                            <div className="search-input-wrapper">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder={searchType === 'nickname' ? 'Nhập tên hiển thị...' : 'Nhập User ID...'}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input"
                                />
                                <button type="submit" className="btn-search">
                                    Tìm kiếm
                                </button>
                            </div>
                        </form>

                        {loading && <div className="loading">Đang tìm kiếm...</div>}

                        {searchResults.length > 0 && (
                            <div className="search-results">
                                {searchResults.map((user) => (
                                    <div key={user._id} className="search-result-card">
                                        <img
                                            src={user.avatarUrl || '/default-avatar.png'}
                                            alt={user.nickname}
                                            className="result-avatar"
                                        />
                                        <div className="result-info">
                                            <h3>{user.nickname}</h3>
                                            <p>@{user.username}</p>
                                            {user.bio && <p className="bio">{user.bio}</p>}
                                        </div>
                                        <button
                                            className="btn-add-friend"
                                            onClick={() => handleSendRequest(user._id)}
                                        >
                                            <FaUserPlus /> Kết bạn
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && searchResults.length === 0 && searchQuery && (
                            <div className="empty-state">
                                <p>Không tìm thấy kết quả phù hợp</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Friends;