import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const RoomSettingsModal = ({ isOpen, onClose, onSave, players = [], currentPlayerMarks = {}, currentTurnTimeLimit = 30, currentFirstTurn = 'X' }) => {
  const [playerMarks, setPlayerMarks] = useState({});
  const [turnTimeLimit, setTurnTimeLimit] = useState(30);
  const [firstTurn, setFirstTurn] = useState('X'); // X hoặc O
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Khởi tạo state từ props
      let initialPlayerMarks = { ...currentPlayerMarks };
      
      // Nếu chưa có playerMarks hoặc không đủ 2 người chơi có mark, tự động gán mặc định
      const marksCount = Object.keys(initialPlayerMarks).filter(key => initialPlayerMarks[key] === 'X' || initialPlayerMarks[key] === 'O').length;
      
      if (players.length >= 2 && marksCount < 2) {
        // Tìm chủ phòng và player còn lại
        const hostPlayer = players.find(p => p.isHost);
        const otherPlayer = players.find(p => !p.isHost);
        
        if (hostPlayer && otherPlayer) {
          const hostId = hostPlayer.userId?.toString();
          const otherId = otherPlayer.userId?.toString();
          
          // Gán mặc định: chủ phòng = X, player còn lại = O
          initialPlayerMarks = {};
          if (hostId) initialPlayerMarks[hostId] = 'X';
          if (otherId) initialPlayerMarks[otherId] = 'O';
        }
      }
      
      setPlayerMarks(initialPlayerMarks);
      setTurnTimeLimit(currentTurnTimeLimit);
      setFirstTurn(currentFirstTurn || 'X');
      setErrors({});
    }
  }, [isOpen, currentPlayerMarks, currentTurnTimeLimit, currentFirstTurn, players]);

  const handleMarkChange = (playerId, mark) => {
    setPlayerMarks(prev => {
      const newMarks = { ...prev };
      
      // Xóa mark cũ của player này nếu có
      Object.keys(newMarks).forEach(key => {
        if (newMarks[key] === mark && key !== playerId.toString()) {
          delete newMarks[key];
        }
      });
      
      // Gán mark mới
      if (mark) {
        newMarks[playerId.toString()] = mark;
      } else {
        delete newMarks[playerId.toString()];
      }
      
      return newMarks;
    });
  };

  const handleSwapMarks = () => {
    if (players.length < 2) return;
    
    const player1Id = players[0]?.userId?.toString();
    const player2Id = players[1]?.userId?.toString();
    
    if (!player1Id || !player2Id) return;
    
    setPlayerMarks(prev => {
      const newMarks = { ...prev };
      const player1Mark = newMarks[player1Id];
      const player2Mark = newMarks[player2Id];
      
      // Hoán đổi
      if (player1Mark) newMarks[player2Id] = player1Mark;
      else delete newMarks[player2Id];
      
      if (player2Mark) newMarks[player1Id] = player2Mark;
      else delete newMarks[player1Id];
      
      return newMarks;
    });
  };

  const handleSave = () => {
    const newErrors = {};
    
    // Validate: phải có đúng 2 người chơi được gán X và O
    const marks = Object.values(playerMarks);
    const xCount = marks.filter(m => m === 'X').length;
    const oCount = marks.filter(m => m === 'O').length;
    
    if (players.length >= 2) {
      if (xCount !== 1 || oCount !== 1) {
        newErrors.playerMarks = 'Phải có đúng 1 người chơi X và 1 người chơi O';
      }
    }
    
    if (turnTimeLimit < 10 || turnTimeLimit > 300) {
      newErrors.turnTimeLimit = 'Thời gian mỗi lượt phải từ 10 đến 300 giây';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSave({ playerMarks, turnTimeLimit, firstTurn });
    } else {
      toast.error('Vui lòng kiểm tra lại thông tin');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Chỉnh sửa cài đặt phòng</h2>
        
        {/* Hiển thị trạng thái X/O */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Phân bổ X/O
          </label>
          {players.length >= 2 ? (
            <div className="flex items-center justify-between gap-4">
              {/* Player 1 - Bên trái */}
              <div className="flex-1 text-center">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Người chơi 1</div>
                  <div className="font-semibold text-lg mb-3">
                    {players[0]?.nickname || players[0]?.username || 'Unknown'}
                  </div>
                  <div className="flex justify-center">
                    <div className={`px-8 py-3 rounded-lg font-bold text-lg ${
                      playerMarks[players[0]?.userId?.toString()] === 'X'
                        ? 'bg-blue-600 text-white'
                        : playerMarks[players[0]?.userId?.toString()] === 'O'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {playerMarks[players[0]?.userId?.toString()] || '?'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Nút hoán đổi ở giữa */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleSwapMarks}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
                  title="Hoán đổi X/O"
                >
                  ⇄
                </button>
                <span className="text-xs text-gray-500">Hoán đổi</span>
              </div>

              {/* Player 2 - Bên phải */}
              <div className="flex-1 text-center">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Người chơi 2</div>
                  <div className="font-semibold text-lg mb-3">
                    {players[1]?.nickname || players[1]?.username || 'Unknown'}
                  </div>
                  <div className="flex justify-center">
                    <div className={`px-8 py-3 rounded-lg font-bold text-lg ${
                      playerMarks[players[1]?.userId?.toString()] === 'X'
                        ? 'bg-blue-600 text-white'
                        : playerMarks[players[1]?.userId?.toString()] === 'O'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {playerMarks[players[1]?.userId?.toString()] || '?'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Cần ít nhất 2 người chơi để phân bổ X/O</p>
          )}
          {errors.playerMarks && (
            <p className="mt-2 text-sm text-red-600">{errors.playerMarks}</p>
          )}
        </div>

        {/* Chọn ai đi trước */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ai đi trước?
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setFirstTurn('X')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                firstTurn === 'X'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              X đi trước
            </button>
            <button
              onClick={() => setFirstTurn('O')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                firstTurn === 'O'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              O đi trước
            </button>
          </div>
        </div>

        {/* Thời gian mỗi lượt */}
        <div className="mb-6">
          <label htmlFor="turnTimeLimit" className="block text-sm font-medium text-gray-700 mb-2">
            Thời gian mỗi lượt đi (giây)
          </label>
          <input
            type="number"
            id="turnTimeLimit"
            min="10"
            max="300"
            value={turnTimeLimit}
            onChange={(e) => setTurnTimeLimit(parseInt(e.target.value) || 30)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.turnTimeLimit
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          <p className="mt-1 text-sm text-gray-500">
            Thời gian tối thiểu: 10s, tối đa: 300s
          </p>
          {errors.turnTimeLimit && (
            <p className="mt-1 text-sm text-red-600">{errors.turnTimeLimit}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomSettingsModal;

