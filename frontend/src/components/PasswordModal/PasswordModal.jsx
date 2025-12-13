import React, { useState } from 'react';
import { roomApi } from '../../services/api/roomApi';

const PasswordModal = ({ isOpen, onClose, onSubmit, roomName, roomId }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Ghi log props khi component render để debug
  React.useEffect(() => {
    if (isOpen) {
      console.log('PasswordModal đã được mount/re-render:', { 
        isOpen, 
        roomId, 
        roomName,
        hasOnSubmit: !!onSubmit 
      });
    }
  }, [isOpen, roomId, roomName, onSubmit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('PasswordModal handleSubmit được gọi', { 
      roomId, 
      passwordLength: password?.length, 
      hasPassword: !!password,
      props: { roomId, roomName, hasOnSubmit: !!onSubmit }
    });
    
    if (!password || !password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    // Nếu không có roomId và không có onSubmit, không thể xử lý
    // Nhưng nếu có onSubmit, có thể xử lý được (onSubmit sẽ tự xử lý roomId)
    if (!roomId && !onSubmit) {
      console.error('Không có roomId và không có onSubmit trong PasswordModal - không thể tiếp tục');
      setError('Lỗi: Không có thông tin phòng. Vui lòng thử lại.');
      // Đóng modal sau 2 giây nếu không có roomId
      setTimeout(() => {
        onClose();
      }, 2000);
      return;
    }
    
    // Nếu có onSubmit nhưng không có roomId, vẫn cho phép gọi onSubmit
    // (onSubmit có thể tự xử lý, ví dụ như navigate với password trong state)
    if (!roomId && onSubmit) {
      console.log('Không có roomId nhưng có onSubmit - vẫn gọi onSubmit');
    }

    setIsVerifying(true);
    setError('');

    try {
      // Gọi onSubmit - nó sẽ verify password và join socket
      console.log('Đang gọi onSubmit với mật khẩu:', password?.substring(0, 2) + '***');
      await onSubmit(password.trim());
      // Nếu thành công, reset form (modal sẽ được đóng bởi parent component)
      setPassword('');
      setError('');
      console.log('PasswordModal submit thành công');
    } catch (err) {
      // Nếu có lỗi, hiển thị lỗi
      console.error('Lỗi khi PasswordModal submit:', err);
      const errorMessage = err.message || err.response?.data?.message || 'Mật khẩu không đúng';
      setError(errorMessage);
      // Không đóng modal nếu password sai, để user có thể nhập lại
      // Nếu lỗi là về room info, modal sẽ được đóng bởi parent
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Nhập mật khẩu</h2>
        <p className="text-gray-600 mb-4">Phòng <span className="font-semibold">{roomName}</span> yêu cầu mật khẩu</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Nhập mật khẩu phòng"
              autoFocus
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Đang kiểm tra...' : 'Tham gia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;

