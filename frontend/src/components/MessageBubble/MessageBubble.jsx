import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import './MessageBubble.css';

const MessageBubble = ({ message, isOwnMessage, showAvatar = true }) => {
    const { username, avatarUrl, content, timestamp } = message;

    const formatTime = (date) => {
        try {
            return formatDistanceToNow(new Date(date), {
                addSuffix: true,
                locale: vi
            });
        } catch {
            return 'Vừa xong';
        }
    };

    return (
        <div className={`message-bubble ${isOwnMessage ? 'own-message' : 'other-message'}`}>
            {!isOwnMessage && showAvatar && (
                <div className="message-avatar">
                    <img
                        src={avatarUrl || '/default-avatar.png'}
                        alt={username}
                        className="avatar-img"
                    />
                </div>
            )}

            <div className="message-content-wrapper">
                {!isOwnMessage && (
                    <div className="message-username">{username}</div>
                )}

                <div className="message-bubble-content">
                    <p className="message-text">{content}</p>
                    <span className="message-time">{formatTime(timestamp)}</span>
                </div>
            </div>

            {isOwnMessage && showAvatar && (
                <div className="message-avatar">
                    <img
                        src={avatarUrl || '/default-avatar.png'}
                        alt="You"
                        className="avatar-img"
                    />
                </div>
            )}
        </div>
    );
};

MessageBubble.propTypes = {
    message: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        userId: PropTypes.string,
        username: PropTypes.string.isRequired,
        avatarUrl: PropTypes.string,
        content: PropTypes.string.isRequired,
        timestamp: PropTypes.string.isRequired
    }).isRequired,
    isOwnMessage: PropTypes.bool,
    showAvatar: PropTypes.bool
};

export default MessageBubble;
