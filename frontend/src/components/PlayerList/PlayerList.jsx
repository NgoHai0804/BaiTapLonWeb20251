import React from 'react';
import { useSelector } from 'react-redux';

const PlayerList = () => {
  const { players, currentPlayerIndex } = useSelector((state) => state.game);
  const { user } = useSelector((state) => state.user);

  if (!players || players.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Người chơi</h3>
        <p className="text-gray-500 text-sm">Chưa có người chơi</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Người chơi ({players.length})</h3>
      <div className="space-y-2">
        {players.map((player, index) => {
          const isCurrentPlayer = index === currentPlayerIndex;
          const isMe = user?.id === player.userId || user?._id === player.userId?.toString();
          
          return (
            <div
              key={player.userId || index}
              className={`
                p-3 rounded-lg border-2 transition-all
                ${isCurrentPlayer ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                ${isMe ? 'bg-green-50' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold">
                    {player.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {player.username || 'Unknown'}
                      {isMe && <span className="ml-2 text-xs text-green-600">(Bạn)</span>}
                    </p>
                    {player.isHost && (
                      <span className="text-xs text-yellow-600">👑 Chủ phòng</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {isCurrentPlayer && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Đang chơi</span>
                  )}
                  {player.isReady && (
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">Sẵn sàng</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerList;
