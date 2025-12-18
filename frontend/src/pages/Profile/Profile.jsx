import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    fetchUserProfile,
    updateUserProfile,
    fetchUserStats,
    clearUpdateSuccess,
    clearUserError
} from '../../store/userSlice';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { profile, stats, loading, error, updateSuccess } = useSelector((state) => state.user);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        nickname: '',
        bio: '',
        avatarUrl: ''
    });

    useEffect(() => {
        if (user) {
            dispatch(fetchUserProfile());
            dispatch(fetchUserStats(user._id));
        }
    }, [dispatch, user]);

    useEffect(() => {
        if (profile) {
            setFormData({
                username: profile.username || '',
                nickname: profile.nickname || '',
                bio: profile.bio || '',
                avatarUrl: profile.avatarUrl || ''
            });
        }
    }, [profile]);

    useEffect(() => {
        if (updateSuccess) {
            toast.success('Cập nhật profile thành công!');
            setIsEditing(false);
            dispatch(clearUpdateSuccess());
        }
    }, [updateSuccess, dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearUserError());
        }
    }, [error, dispatch]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(updateUserProfile(formData));
    };

    const handleCancel = () => {
        setFormData({
            username: profile.username || '',
            nickname: profile.nickname || '',
            bio: profile.bio || '',
            avatarUrl: profile.avatarUrl || ''
        });
        setIsEditing(false);
    };

    if (loading && !profile) {
        return (
            <div className="profile-loading">
                <div className="spinner"></div>
                <p>Đang tải thông tin...</p>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1>Hồ sơ cá nhân</h1>
                {!isEditing && (
                    <button
                        className="btn-edit"
                        onClick={() => setIsEditing(true)}
                    >
                        Chỉnh sửa
                    </button>
                )}
            </div>

            <div className="profile-content">
                {/* Left Side - Avatar & Basic Info */}
                <div className="profile-sidebar">
                    <div className="profile-avatar-section">
                        <div className="avatar-wrapper">
                            <img
                                src={formData.avatarUrl || '/default-avatar.png'}
                                alt="Avatar"
                                className="profile-avatar"
                            />
                            {isEditing && (
                                <div className="avatar-overlay">
                                    <span>Đổi ảnh</span>
                                </div>
                            )}
                        </div>
                        {!isEditing && (
                            <>
                                <h2>{profile?.nickname}</h2>
                                <p className="username">@{profile?.username}</p>
                            </>
                        )}
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="profile-stats">
                            <h3>Thống kê</h3>
                            <div className="stat-item">
                                <span className="stat-label">Tổng trận:</span>
                                <span className="stat-value">{stats.totalGames}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Thắng:</span>
                                <span className="stat-value win">{stats.wins}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Thua:</span>
                                <span className="stat-value lose">{stats.losses}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Tỷ lệ thắng:</span>
                                <span className="stat-value">{stats.winRate}%</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side - Profile Form */}
                <div className="profile-main">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username">Tên đăng nhập</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="nickname">Tên hiển thị</label>
                            <input
                                type="text"
                                id="nickname"
                                name="nickname"
                                value={formData.nickname}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="avatarUrl">URL Avatar</label>
                            <input
                                type="text"
                                id="avatarUrl"
                                name="avatarUrl"
                                value={formData.avatarUrl}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                placeholder="https://example.com/avatar.jpg"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="bio">Giới thiệu</label>
                            <textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                rows="4"
                                maxLength="500"
                                placeholder="Viết vài dòng về bản thân..."
                            />
                            <span className="char-count">{formData.bio.length}/500</span>
                        </div>

                        {isEditing && (
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={handleCancel}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="btn-save"
                                    disabled={loading}
                                >
                                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        )}
                    </form>

                    {/* Game History Section */}
                    {stats?.recentGames && stats.recentGames.length > 0 && (
                        <div className="recent-games">
                            <h3>Lịch sử gần đây</h3>
                            <div className="games-list">
                                {stats.recentGames.map((game) => (
                                    <div key={game._id} className="game-item">
                                        <div className="game-info">
                                            <span className="game-date">
                                                {new Date(game.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                            <span className={`game-result ${game.winner === 'draw' ? 'draw' : game.winnerUserId === user._id ? 'win' : 'lose'}`}>
                                                {game.winner === 'draw' ? 'Hòa' : game.winnerUserId === user._id ? 'Thắng' : 'Thua'}
                                            </span>
                                        </div>
                                        <button
                                            className="btn-replay"
                                            onClick={() => navigate(`/replay/${game._id}`)}
                                        >
                                            Xem lại
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;