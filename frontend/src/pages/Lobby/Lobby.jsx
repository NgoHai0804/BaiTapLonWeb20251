import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { roomApi } from '../../services/api/roomApi';
import { setRooms, addRoom, removeRoom, updateRoom } from '../../store/roomSlice';
import { gameSocket } from '../../services/socket/gameSocket';
import RoomCard from '../../components/RoomCard/RoomCard';

const Lobby = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { rooms } = useSelector((state) => state.room);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, waiting, playing, full

  useEffect(() => {
    console.log('🏠 Lobby component mounted, loading rooms...');
    loadRooms();

    // Listen for room updates
    const handleRoomUpdate = (data) => {
      console.log('🔄 Room update received:', data);
      if (data?.room) {
        dispatch(updateRoom(data.room));
      }
    };

    const handlePlayerJoined = (data) => {
      console.log('👤 Player joined:', data);
      if (data?.room) {
        dispatch(updateRoom(data.room));
      }
    };

    const handlePlayerLeft = (data) => {
      console.log('👋 Player left:', data);
      if (data?.room) {
        dispatch(updateRoom(data.room));
      }
    };

    try {
      gameSocket.onRoomUpdate(handleRoomUpdate);
      gameSocket.onPlayerJoined(handlePlayerJoined);
      gameSocket.onPlayerLeft(handlePlayerLeft);
    } catch (error) {
      console.error('❌ Error setting up socket listeners:', error);
    }

    return () => {
      try {
        gameSocket.offRoomUpdate(handleRoomUpdate);
        gameSocket.offPlayerJoined(handlePlayerJoined);
        gameSocket.offPlayerLeft(handlePlayerLeft);
      } catch (error) {
        console.error('❌ Error cleaning up socket listeners:', error);
      }
    };
  }, [dispatch]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching rooms from API...');
      const response = await roomApi.getRooms();
      console.log('📦 API response:', response);
      
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
      
      console.log('✅ Loaded rooms:', rooms.length);
      dispatch(setRooms(rooms));
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tải danh sách phòng';
      toast.error(errorMessage);
      console.error('❌ Load rooms error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      // Set empty array on error
      dispatch(setRooms([]));
    } finally {
      setLoading(false);
    }
  };

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

  console.log('🎨 Rendering Lobby:', { loading, roomsCount: rooms?.length || 0, filteredCount: filteredRooms?.length || 0 });

  // Safety check
  if (!rooms) {
    console.warn('⚠️ Rooms is null/undefined, initializing...');
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="waiting">Đang chờ</option>
              <option value="playing">Đang chơi</option>
              <option value="full">Đầy</option>
            </select>
            <button
              onClick={loadRooms}
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
