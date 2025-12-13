import React from 'react';
import { useSelector } from 'react-redux';

// Helper function để lấy ELO từ user data
const getEloScore = (userData) => {
  if (!userData?.gameStats || userData.gameStats.length === 0) {
    return 1000; // Default ELO
  }
  const caroStats = userData.gameStats.find(s => s.gameId === 'caro') || userData.gameStats[0];
  return caroStats?.score || 1000;
};

const PlayerList = ({ playerMarks = {} }) => {
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
          
          // Lấy ELO: nếu là user hiện tại thì lấy từ user store, nếu không thì từ player data (nếu có)
          const eloScore = isMe 
            ? getEloScore(user) 
            : (player.elo || player.score || null);
          
          return (
            <div
              key={player.userId || index}
              className={`
                rounded-lg border-2 transition-all flex items-stretch overflow-hidden
                ${isCurrentPlayer ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                ${isMe ? 'bg-green-50' : ''}
              `}
            >
              <div className="flex items-center gap-2 flex-1 p-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {player.avatarUrl ? (
                    <img 
                      src={player.avatarUrl} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-sm font-bold text-gray-600">
                      {(player.nickname || player.username)?.[0]?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm flex items-center gap-2">
                    {player.nickname || player.username || 'Unknown'}
                    {isMe && <span className="text-xs text-green-600">(Bạn)</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {eloScore !== null && (
                      <span className="text-xs font-semibold text-purple-600">
                        ELO: {eloScore}
                      </span>
                    )}
                    {player.isHost && (
                      <span className="text-xs text-yellow-600">👑 Chủ phòng</span>
                    )}
                  </div>
                </div>
              </div>
              {playerMarks[player.userId?.toString()] && (
                <div className={`h-full flex items-center justify-center px-4 font-bold text-lg min-w-[48px] ${
                  playerMarks[player.userId?.toString()] === 'X' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-red-600 text-white'
                }`}>
                  {playerMarks[player.userId?.toString()]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerList;
