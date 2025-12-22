import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    removeNotification,
    markAsRead,
    clearAllNotifications,
    toggleSound
} from '../../store/notificationSlice';
import {
    FaBell,
    FaTimes,
    FaUserFriends,
    FaGamepad,
    FaEnvelope,
    FaInfoCircle,
    FaVolumeUp,
    FaVolumeMute,
    FaTrash
} from 'react-icons/fa';
import './NotificationToast.css';

const NotificationToast = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { notifications, unreadCount, soundEnabled } = useSelector((state) => state.notification);

    // Auto-remove old notifications
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            notifications.forEach(notif => {
                const notifTime = new Date(notif.timestamp);
                const diffMinutes = (now - notifTime) / 1000 / 60;

                // Remove notifications older than 5 minutes
                if (diffMinutes > 5 && notif.read) {
                    dispatch(removeNotification(notif.id));
                }
            });
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [notifications, dispatch]);

    const handleNotificationClick = (notif) => {
        // Mark as read
        dispatch(markAsRead(notif.id));

        // Navigate based on notification type
        switch (notif.type) {
            case 'friend_online':
            case 'friend_request':
            case 'friend_accepted':
                navigate('/friends');
                break;

            case 'invite_room':
                if (notif.roomId) {
                    navigate(`/room/${notif.roomId}`);
                }
                break;

            case 'message':
                // Open chat with sender
                break;

            case 'game_started':
            case 'game_ended':
                if (notif.roomId) {
                    navigate(`/room/${notif.roomId}`);
                }
                break;

            default:
                break;
        }

        // Remove notification after click
        setTimeout(() => {
            dispatch(removeNotification(notif.id));
        }, 300);
    };

    const handleRemove = (e, notifId) => {
        e.stopPropagation();
        dispatch(removeNotification(notifId));
    };

    const handleToggleSound = () => {
        dispatch(toggleSound());
    };

    const handleClearAll = () => {
        if (window.confirm('Xóa tất cả thông báo?')) {
            dispatch(clearAllNotifications());
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'friend_online':
            case 'friend_offline':
            case 'friend_request':
            case 'friend_accepted':
                return <FaUserFriends className="notif-icon friend" />;

            case 'invite_room':
            case 'game_started':
            case 'game_ended':
                return <FaGamepad className="notif-icon game" />;

            case 'message':
                return <FaEnvelope className="notif-icon message" />;

            default:
                return <FaInfoCircle className="notif-icon system" />;
        }
    };

    // Show only recent unread notifications (max 5)
    const recentNotifications = notifications
        .filter(n => !n.read)
        .slice(0, 5);

    if (recentNotifications.length === 0) {
        return null;
    }

    return (
        <div className="notification-container">
            {/* Header */}
            <div className="notification-header">
                <div className="notification-header-left">
                    <FaBell className="bell-icon" />
                    <span className="notification-title">
                        Thông báo ({unreadCount})
                    </span>
                </div>
                <div className="notification-header-actions">
                    <button
                        className="btn-sound"
                        onClick={handleToggleSound}
                        title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                    >
                        {soundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
                    </button>
                    <button
                        className="btn-clear-all"
                        onClick={handleClearAll}
                        title="Xóa tất cả"
                    >
                        <FaTrash />
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="notifications-list">
                {recentNotifications.map((notif) => (
                    <div
                        key={notif.id}
                        className={`notification-item ${notif.type}`}
                        onClick={() => handleNotificationClick(notif)}
                    >
                        <div className="notification-content">
                            {getIcon(notif.type)}

                            <div className="notification-text">
                                <div className="notification-title-text">{notif.title}</div>
                                <div className="notification-message">{notif.message}</div>
                            </div>
                        </div>

                        <button
                            className="btn-remove-notif"
                            onClick={(e) => handleRemove(e, notif.id)}
                        >
                            <FaTimes />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotificationToast;
