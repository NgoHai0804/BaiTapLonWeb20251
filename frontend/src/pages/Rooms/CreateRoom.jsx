import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { roomApi } from '../../services/api/roomApi';
import { gameSocket } from '../../services/socket/gameSocket';

const CreateRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inviteFriendId = location.state?.inviteFriendId;
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    maxPlayers: 2,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'maxPlayers' ? parseInt(value) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên phòng';
    }
    if (formData.maxPlayers < 2 || formData.maxPlayers > 4) {
      newErrors.maxPlayers = 'Số người chơi phải từ 2 đến 4';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await roomApi.createRoom(formData);
      const room = response.room || response.data || response;
      const roomId = room._id || room.id;
      
      // Nếu có mật khẩu, lưu vào sessionStorage để tự động join
      if (formData.password) {
        sessionStorage.setItem(`room_password_${roomId}`, formData.password);
      }
      
      toast.success('Tạo phòng thành công!');
      
      // Nếu có inviteFriendId, gửi lời mời sau khi join vào phòng
      if (inviteFriendId) {
        // Đợi một chút để đảm bảo socket đã join phòng
        setTimeout(() => {
          gameSocket.inviteToRoom(roomId, inviteFriendId);
          toast.info('Đã gửi lời mời đến bạn bè');
        }, 1000);
      }
      
      // Tự động join vào phòng vừa tạo
      navigate(`/game/${roomId}`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tạo phòng';
      toast.error(errorMessage);
      console.error('Create room error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Tạo phòng mới</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Tên phòng
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.name
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Nhập tên phòng"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu (tùy chọn)
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Để trống nếu không muốn đặt mật khẩu"
              />
            </div>

            {/* Max Players */}
            <div>
              <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-700 mb-2">
                Số người chơi tối đa
              </label>
              <select
                id="maxPlayers"
                name="maxPlayers"
                value={formData.maxPlayers}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.maxPlayers
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              >
                <option value={2}>2 người</option>
                <option value={3}>3 người</option>
                <option value={4}>4 người</option>
              </select>
              {errors.maxPlayers && (
                <p className="mt-1 text-sm text-red-600">{errors.maxPlayers}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/lobby')}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang tạo...' : 'Tạo phòng'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
