import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    fetchRooms,
    createRoom as createRoomAction,
    joinRoom as joinRoomAction,
    setRooms,
    addRoom,
    removeRoom,
    updateRoom,
    clearError,
    clearActionSuccess
} from '../../store/roomSlice';
import { useSocket } from '../../hooks/useSocket';
import RoomCard from '../../components/RoomCard/RoomCard';
import CreateRoomModal from '../../components/CreateRoomModal/CreateRoomModal';
import { FaPlus, FaSearch, FaFilter, FaUsers, FaSyncAlt } from 'react-icons/fa';
import './Lobby.css';

const Lobby = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { rooms, loading, error, actionSuccess } = useSelector((state) => state.room);
    const { user } = useSelector((state) => state.auth);
    const { emit, on } = useSocket();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'available', 'full', 'playing'
    const [passwordInput, setPasswordInput] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Fetch rooms on mount
    useEffect(() => {
        dispatch(fetchRooms());
    }, [dispatch]);

    // Socket event listeners
    useEffect(() => {
        const cleanupFunctions = [];

        // Room created
        const unsubscribeRoomCreated = on('room:created', (room) => {
            console.log('Room created:', room);
            dispatch(addRoom(room));
            toast.info(`Phòng "${room.name}" vừa được tạo`);
        });
        cleanupFunctions.push(unsubscribeRoomCreated);

        // Room updated
        const unsubscribeRoomUpdated = on('room:updated', (room) => {
            console.log('Room updated:', room);
            dispatch(updateRoom(room));
        });
        cleanupFunctions.push(unsubscribeRoomUpdated);

        // Room deleted
        const unsubscribeRoomDeleted = on('room:deleted', (roomId) => {
            console.log('Room deleted:', roomId);
            dispatch(removeRoom(roomId));
            toast.info('Một phòng vừa bị xóa');
        });
        cleanupFunctions.push(unsubscribeRoomDeleted);

        // Rooms list (full refresh)
        const unsubscribeRoomsList = on('rooms:list', (roomsList) => {
            console.log('Rooms list:', roomsList);
            dispatch(setRooms(roomsList));
        });
        cleanupFunctions.push(unsubscribeRoomsList);

        // Cleanup
        return () => {
            cleanupFunctions.forEach(cleanup => cleanup && cleanup());
        };
    }, [on, dispatch]);

    // Handle action success
    useEffect(() => {
        if (actionSuccess) {
            toast.success('Thao tác thành công!');
            dispatch(clearActionSuccess());
            setIsModalOpen(false);
        }
    }, [actionSuccess, dispatch]);

    // Handle errors
    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearError());
        }
    }, [error, dispatch]);

    // Create room handler
    const handleCreateRoom = async (roomData) => {
        const result = await dispatch(createRoomAction(roomData));

        if (createRoomAction.fulfilled.match(result)) {
            const createdRoom = result.payload;

            // Emit socket event
            emit('create_room', roomData);

            // Navigate to room
            navigate(`/room/${createdRoom._id}`);
        }
    };

    // Join room handler
    const handleJoinRoom = (room) => {
        if (room.isPrivate) {
            // Show password modal
            setSelectedRoom(room);
            setShowPasswordModal(true);
        } else {
            // Join directly
            joinRoomDirect(room._id);
        }
    };

    // Join room with password
    const handlePasswordSubmit = () => {
        if (!passwordInput) {
            toast.warning('Vui lòng nhập mật khẩu');
            return;
        }
        joinRoomDirect(selectedRoom._id, passwordInput);
        setShowPasswordModal(false);
        setPasswordInput('');
        setSelectedRoom(null);
    };

    // Join room direct
    const joinRoomDirect = async (roomId, password = null) => {
        const result = await dispatch(joinRoomAction({ roomId, password }));

        if (joinRoomAction.fulfilled.match(result)) {
            // Emit socket event
            emit('join_room', { roomId, userId: user._id });

            // Navigate to room
            navigate(`/room/${roomId}`);
        }
    };

    // Refresh rooms
    const handleRefresh = () => {
        dispatch(fetchRooms());
        toast.info('Đã làm mới danh sách phòng');
    };

    // Filter rooms
    const filteredRooms = rooms.filter(room => {
        // Search filter
        if (searchQuery && !room.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }

        // Status filter
        if (filter === 'available' && (room.status === 'playing' || room.players?.length >= room.maxPlayers)) {
            return false;
        }
        if (filter === 'full' && room.players?.length < room.maxPlayers) {
            return false;
        }
        if (filter === 'playing' && room.status !== 'playing') {
            return false;
        }

        return true;
    });

    return (
        <div className="lobby-container">
            {/* Header */}
            <div className="lobby-header">
                <div className="header-left">
                    <h1>Sảnh chờ</h1>
                    <div className="online-counter">
                        <FaUsers />
                        <span>{rooms.reduce((acc, r) => acc + (r.players?.length || 0), 0)} người đang chơi</span>
                    </div>
                </div>
                <div className="header-right">
                    <button className="btn-create" onClick={() => setIsModalOpen(true)}>
                        <FaPlus /> Tạo phòng
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="lobby-toolbar">
                {/* Search */}
                <div className="search-box">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm phòng..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filter */}
                <div className="filter-group">
                    <FaFilter className="filter-icon" />
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="all">Tất cả</option>
                        <option value="available">Khả dụng</option>
                        <option value="full">Đầy</option>
                        <option value="playing">Đang chơi</option>
                    </select>
                </div>

                {/* Refresh */}
                <button className="btn-refresh" onClick={handleRefresh}>
                    <FaSyncAlt /> Làm mới
                </button>
            </div>

            {/* Rooms Grid */}
            <div className="lobby-content">
                {loading && rooms.length === 0 ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Đang tải danh sách phòng...</p>
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="empty-state">
                        <p>Không tìm thấy phòng nào</p>
                        <button className="btn-create-empty" onClick={() => setIsModalOpen(true)}>
                            <FaPlus /> Tạo phòng đầu tiên
                        </button>
                    </div>
                ) : (
                    <div className="rooms-grid">
                        {filteredRooms.map((room) => (
                            <RoomCard
                                key={room._id}
                                room={room}
                                onJoin={handleJoinRoom}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create Room Modal */}
            <CreateRoomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateRoom}
                loading={loading}
            />

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="password-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Nhập mật khẩu phòng</h3>
                        <input
                            type="password"
                            placeholder="Mật khẩu..."
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                        />
                        <div className="password-actions">
                            <button onClick={() => setShowPasswordModal(false)}>Hủy</button>
                            <button onClick={handlePasswordSubmit}>Vào phòng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Lobby;