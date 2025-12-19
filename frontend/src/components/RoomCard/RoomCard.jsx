import PropTypes from 'prop-types';
import { FaUser, FaLock, FaUnlock, FaGamepad, FaClock } from 'react-icons/fa';
import './RoomCard.css';

const RoomCard = ({ room, onJoin }) => {
    const { name, host, players, maxPlayers, isPrivate, status, gameMode, createdAt } = room;

    const isFull = players?.length >= maxPlayers;
    const isPlaying = status === 'playing';

    const handleJoinClick = () => {
        if (!isFull && !isPlaying) {
            onJoin(room);
        }
    };

    const getStatusBadge = () => {
        if (isPlaying) return <span className="status-badge playing">Đang chơi</span>;
        if (isFull) return <span className="status-badge full">Đầy</span>;
        return <span className="status-badge waiting">Chờ người chơi</span>;
    };

    const getGameModeText = () => {
        switch (gameMode) {
            case '1P': return 'Người vs AI';
            case '2P': return 'Người vs Người';
            default: return 'Online';
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const created = new Date(date);
        const diff = Math.floor((now - created) / 1000 / 60); // minutes

        if (diff < 1) return 'Vừa tạo';
        if (diff < 60) return `${diff} phút trước`;
        const hours = Math.floor(diff / 60);
        if (hours < 24) return `${hours} giờ trước`;
        return `${Math.floor(hours / 24)} ngày trước`;
    };

    return (
        <div className={`room-card ${isFull ? 'full' : ''} ${isPlaying ? 'playing' : ''}`}>
            <div className="room-card-header">
                <div className="room-title">
                    {isPrivate ? <FaLock className="lock-icon" /> : <FaUnlock className="unlock-icon" />}
                    <h3>{name}</h3>
                </div>
                {getStatusBadge()}
            </div>

            <div className="room-card-body">
                <div className="room-info">
                    <div className="info-item">
                        <FaUser className="icon" />
                        <span>Chủ phòng: <strong>{host?.nickname || host?.username || 'N/A'}</strong></span>
                    </div>

                    <div className="info-item">
                        <FaGamepad className="icon" />
                        <span>Chế độ: <strong>{getGameModeText()}</strong></span>
                    </div>

                    <div className="info-item">
                        <FaUser className="icon" />
                        <span className="players-count">
                            Người chơi: <strong>{players?.length || 0}/{maxPlayers}</strong>
                        </span>
                    </div>

                    <div className="info-item">
                        <FaClock className="icon" />
                        <span className="time">{formatTime(createdAt)}</span>
                    </div>
                </div>

                {/* Players List */}
                {players && players.length > 0 && (
                    <div className="players-list">
                        {players.map((player, index) => (
                            <div key={player._id || index} className="player-item">
                                <img
                                    src={player.avatarUrl || '/default-avatar.png'}
                                    alt={player.nickname}
                                    className="player-avatar"
                                />
                                <span className="player-name">{player.nickname || player.username}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="room-card-footer">
                <button
                    className={`btn-join ${isFull || isPlaying ? 'disabled' : ''}`}
                    onClick={handleJoinClick}
                    disabled={isFull || isPlaying}
                >
                    {isPlaying ? 'Đang chơi' : isFull ? 'Phòng đầy' : 'Vào phòng'}
                </button>
            </div>
        </div>
    );
};

RoomCard.propTypes = {
    room: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        host: PropTypes.object,
        players: PropTypes.array,
        maxPlayers: PropTypes.number,
        isPrivate: PropTypes.bool,
        status: PropTypes.string,
        gameMode: PropTypes.string,
        createdAt: PropTypes.string
    }).isRequired,
    onJoin: PropTypes.func.isRequired
};

export default RoomCard;