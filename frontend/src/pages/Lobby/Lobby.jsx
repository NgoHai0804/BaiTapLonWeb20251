import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { roomApi } from '../../services/api/roomApi';
import { setRooms, addRoom, removeRoom, updateRoom } from '../../store/roomSlice';
import { gameSocket } from '../../services/socket/gameSocket';
import RoomCard from '../../components/RoomCard/RoomCard';

const Lobby = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { rooms } = useSelector((state) => state.room);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, waiting, playing, full
  
  // Refs để track auto-refresh
  const refreshIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const isUserActiveRef = useRef(true);
  const previousPathnameRef = useRef(location.pathname);

  // Load rooms function
  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Đang tải danh sách phòng từ API...');
      const response = await roomApi.getRooms();
      console.log('Phản hồi từ API:', response);
      
      // Backend trả về { success: true, data: [...], message: "..." }
      // hoặc array trực tiếp
      let rooms = [];
      if (Array.isArray(response)) {
        rooms = response;
      } else if (response?.data && Array.isArray(response.data)) {
        rooms = response.data;
      } else if (response?.rooms && Array.isArray(response.rooms)) {
        rooms = response.rooms;
      }
      
      console.log('Đã tải', rooms.length, 'phòng');
      dispatch(setRooms(rooms));
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tải danh sách phòng';
      toast.error(errorMessage);
      console.error('Lỗi khi tải danh sách phòng:', error);
      console.error('Chi tiết lỗi:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      // Đặt mảng rỗng khi có lỗi
      dispatch(setRooms([]));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Theo dõi hoạt động của user
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    isUserActiveRef.current = true;
  }, []);

  // Tự động làm mới danh sách phòng mỗi 10 giây nếu user không thao tác
  useEffect(() => {
    const checkAndRefresh = () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      // Nếu user không thao tác trong 2 giây trở lên, cho phép auto-refresh
      if (timeSinceLastActivity >= 2000) {
        isUserActiveRef.current = false;
        loadRooms();
      }
    };

    // Bắt đầu interval auto-refresh mỗi 10 giây
    refreshIntervalRef.current = setInterval(checkAndRefresh, 10000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [loadRooms]);

  // Listen for user activity events
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [updateActivity]);

  // Tự động load lại khi navigate về từ game room
  useEffect(() => {
    // Nếu có state từ location (ví dụ: từ GameRoom khi rời phòng)
    if (location.state?.fromGameRoom) {
      console.log('Đã điều hướng từ game room, đang làm mới danh sách phòng...');
      loadRooms();
      // Clear state để tránh load lại nhiều lần
      window.history.replaceState({}, document.title);
    }
  }, [location.state, loadRooms]);

  // Tự động load lại khi pathname thay đổi về /lobby (khi quay về lobby từ bất kỳ trang nào)
  useEffect(() => {
    const currentPathname = location.pathname;
    const previousPathname = previousPathnameRef.current;
    
    // Chỉ load lại nếu:
    // 1. Đang ở trang /lobby
    // 2. Pathname đã thay đổi (không phải lần đầu mount)
    // 3. Pathname trước đó không phải là /lobby (tránh load lại khi đã ở lobby)
    if (currentPathname === '/lobby' && previousPathname !== currentPathname && previousPathname !== '') {
      console.log('Đã điều hướng đến trang lobby, đang tải danh sách phòng...');
      loadRooms();
    }
    
    // Cập nhật previous pathname
    previousPathnameRef.current = currentPathname;
  }, [location.pathname, loadRooms]);

  useEffect(() => {
    console.log('Component Lobby đã được mount, đang tải danh sách phòng...');
    loadRooms();

    // Listen for room updates
    const handleRoomUpdate = (data) => {
      console.log('Room update received:', data);
      if (data?.room) {
        dispatch(updateRoom(data.room));
      }
    };

    const handlePlayerJoined = (data) => {
      console.log('Người chơi đã tham gia:', data);
      if (data?.room) {
        dispatch(updateRoom(data.room));
      }
    };

    const handlePlayerLeft = (data) => {
      console.log('Người chơi đã rời:', data);
      if (data?.room) {
        dispatch(updateRoom(data.room));
      }
    };

    try {
      gameSocket.onRoomUpdate(handleRoomUpdate);
      gameSocket.onPlayerJoined(handlePlayerJoined);
      gameSocket.onPlayerLeft(handlePlayerLeft);
    } catch (error) {
      console.error('Lỗi khi thiết lập socket listeners:', error);
    }

    return () => {
      try {
        gameSocket.offRoomUpdate(handleRoomUpdate);
        gameSocket.offPlayerJoined(handlePlayerJoined);
        gameSocket.offPlayerLeft(handlePlayerLeft);
      } catch (error) {
        console.error('Lỗi khi dọn dẹp socket listeners:', error);
      }
    };
  }, [dispatch, loadRooms]);


  const handleCreateRoom = () => {
    navigate('/rooms/create');
  };

  const filteredRooms = (rooms || []).filter((room) => {
    if (!room) return false;
    const matchesSearch = room.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'waiting' && room.status === 'waiting') ||
      (filter === 'playing' && room.status === 'playing') ||
      (filter === 'full' && room.players?.length >= room.maxPlayers);
    return matchesSearch && matchesFilter;
  });

  console.log('Đang render Lobby:', { loading, roomsCount: rooms?.length || 0, filteredCount: filteredRooms?.length || 0 });

  // Safety check
  if (!rooms) {
    console.warn('Rooms là null/undefined, đang khởi tạo...');
    dispatch(setRooms([]));
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Lobby</h1>
            <button
              onClick={handleCreateRoom}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Tạo phòng mới
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm phòng..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                updateActivity();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                updateActivity();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="waiting">Đang chờ</option>
              <option value="playing">Đang chơi</option>
              <option value="full">Đầy</option>
            </select>
            <button
              onClick={() => {
                updateActivity();
                loadRooms();
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔄 Làm mới
            </button>
          </div>
        </div>

        {/* Rooms List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Đang tải...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 text-lg">Không có phòng nào</p>
            <button
              onClick={handleCreateRoom}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tạo phòng đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => (
              <RoomCard key={room._id} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
