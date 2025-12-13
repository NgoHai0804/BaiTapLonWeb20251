import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { gameSocket } from '../../services/socket/gameSocket';
import { useGameState } from '../../hooks/useGameState';
import { useAuth } from '../../hooks/useAuth';
import { useCountdown } from '../../hooks/useCountdown';
import { useGameRoomSetup } from '../../hooks/useGameRoomSetup';
import { useGameRoomLobby } from '../../hooks/useGameRoomLobby';
import { useGameRoomPlaying } from '../../hooks/useGameRoomPlaying';
import { useGameRoomEnd } from '../../hooks/useGameRoomEnd';
import { setRoom, resetGame, setMove } from '../../store/gameSlice';
import { updateRoom, clearCurrentRoom } from '../../store/roomSlice';
import { clearGame } from '../../store/gameSlice';
import GameBoard from '../../components/GameBoard/GameBoard';
import PlayerList from '../../components/PlayerList/PlayerList';
import PasswordModal from '../../components/PasswordModal/PasswordModal';
import DrawRequestModal from '../../components/DrawRequestModal/DrawRequestModal';
import SurrenderModal from '../../components/SurrenderModal/SurrenderModal';
import RoomSettingsModal from '../../components/RoomSettingsModal/RoomSettingsModal';
import ChatBox from '../../components/ChatBox/ChatBox';
import { ROOM_STATUS, TIME_LIMIT } from '../../utils/constants';

const GameRoom = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { currentRoom } = useSelector((state) => state.room);
  const { board, isGameOver, currentPlayerIndex, players, history } = useGameState();
  
  // Kiểm tra roomId khi component render
  useEffect(() => {
    console.log('Component GameRoom - roomId từ useParams:', roomId);
    if (!roomId) {
      console.warn('Không có roomId trong URL, đang chuyển hướng đến lobby');
      navigate('/lobby');
    }
  }, [roomId, navigate]);

  // Hook: Setup - xử lý join room, password, reconnect
  const {
    roomInfo,
    hasJoined,
    isJoining,
    showPasswordModal,
    playerMarks,
    turnTimeLimit,
    firstTurn,
    setPlayerMarks,
    setTurnTimeLimit,
    setFirstTurn,
    handlePasswordSubmit,
    handlePasswordCancel,
  } = useGameRoomSetup(roomId);

  // Hook: Lobby - xử lý ready, start game, settings
  const {
    handleReady,
    handleStartGame,
    handleSaveRoomSettings,
    setupLobbyListeners,
  } = useGameRoomLobby(roomId, currentRoom);

  // Hook: Playing - xử lý moves, timer, draw, surrender
  const {
    gameStartTime,
    pingTimeoutRemaining,
    turnTimeRemaining,
    showDrawModal,
    showSurrenderModal,
    drawRequestInfo,
    handleCellClick,
    handleRequestDraw,
    handleDrawAccept,
    handleDrawReject,
    handleDrawCancel,
    handleSurrender,
    handleConfirmSurrender,
    handleCancelSurrender,
    formatGameDuration,
    setupPlayingListeners,
    stopPingInterval,
    stopTurnTimer,
  } = useGameRoomPlaying(roomId, hasJoined, currentRoom, setPlayerMarks, setTurnTimeLimit, setFirstTurn);

  // Hook: End - xử lý game end
  const {
    gameResult,
    gameResultMessage,
    handleGameEnd,
    resetGameEndFlags,
    setupGameEndListener,
  } = useGameRoomEnd(stopPingInterval, stopTurnTimer);

  const [showRoomSettingsModal, setShowRoomSettingsModal] = useState(false);

  // Setup listeners cho lobby
  useEffect(() => {
    const cleanup = setupLobbyListeners();
    return cleanup;
  }, [setupLobbyListeners]);

  // Setup listeners cho playing và end
  useEffect(() => {
    const onGameStart = (data) => {
      // Reset flags khi bắt đầu game mới
      resetGameEndFlags();
    };

    const cleanupPlaying = setupPlayingListeners(
      onGameStart,
      handleGameEnd
    );
    const cleanupEnd = setupGameEndListener();

    return () => {
      cleanupPlaying();
      cleanupEnd();
    };
  }, [setupPlayingListeners, setupGameEndListener, handleGameEnd, resetGameEndFlags, setPlayerMarks, setTurnTimeLimit, setFirstTurn]);

  // Xử lý rời phòng
  const handleLeaveRoom = useCallback(() => {
    if (window.confirm('Bạn có chắc muốn rời phòng?')) {
      stopPingInterval();
      gameSocket.leaveRoom(roomId);
      dispatch(clearCurrentRoom());
      dispatch(clearGame());
      navigate('/lobby', { state: { fromGameRoom: true } });
    }
  }, [roomId, navigate, dispatch, stopPingInterval]);

  // Tính toán các giá trị UI
  const userId = user?.id || user?._id;
  const hostIdMatch = currentRoom?.hostId?.toString() === userId?.toString();
  const player = currentRoom?.players?.find(p => 
    p.userId?.toString() === userId?.toString() || p.userId === userId
  );
  const isHost = hostIdMatch || player?.isHost || false;
  const isPlaying = currentRoom?.status === ROOM_STATUS.PLAYING;
  const currentPlayer = players?.[currentPlayerIndex];
  const isMyTurn = currentPlayer?.userId?.toString() === userId?.toString();

  // Timer cho mỗi lượt đi (legacy, có thể dùng turnTimeRemaining từ hook)
  const { timeLeft, start: startTimer, reset: resetTimer } = useCountdown(TIME_LIMIT, () => {
    if (isPlaying && isMyTurn && !isGameOver) {
      toast.warning('Hết thời gian! Lượt của bạn đã kết thúc.');
    }
  });

  useEffect(() => {
    if (isPlaying && isMyTurn && !isGameOver) {
      resetTimer(TIME_LIMIT);
      startTimer(TIME_LIMIT);
    } else {
      resetTimer(TIME_LIMIT);
    }
  }, [isMyTurn, isPlaying, isGameOver, resetTimer, startTimer]);

  // Hiển thị loading khi đang join
  if (isJoining && !currentRoom && !roomInfo && !showPasswordModal) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Đang tải thông tin phòng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Password Modal */}
        <PasswordModal
          isOpen={showPasswordModal && !!roomId}
          onClose={handlePasswordCancel}
          onSubmit={handlePasswordSubmit}
          roomName={roomInfo?.name || 'Phòng chơi'}
          roomId={roomId}
        />

        {/* Draw Request Modal */}
        <DrawRequestModal
          isOpen={showDrawModal && !!drawRequestInfo}
          onClose={() => {
            // Modal sẽ được đóng bởi handlers
          }}
          onAccept={handleDrawAccept}
          onReject={handleDrawReject}
          onCancel={handleDrawCancel}
          requesterUsername={drawRequestInfo?.requesterUsername}
          requesterNickname={drawRequestInfo?.requesterNickname}
          isRequester={
            drawRequestInfo && (user?.id || user?._id)?.toString() === drawRequestInfo.requesterId?.toString()
          }
        />

        {/* Surrender Modal */}
        <SurrenderModal
          isOpen={showSurrenderModal}
          onClose={handleCancelSurrender}
          onConfirm={handleConfirmSurrender}
        />

        {/* Room Settings Modal */}
        <RoomSettingsModal
          isOpen={showRoomSettingsModal}
          onClose={() => setShowRoomSettingsModal(false)}
          onSave={(settings) => {
            handleSaveRoomSettings(settings);
            setShowRoomSettingsModal(false);
          }}
          players={currentRoom?.players || []}
          currentPlayerMarks={playerMarks}
          currentTurnTimeLimit={turnTimeLimit}
          currentFirstTurn={firstTurn}
        />

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {currentRoom?.name || roomInfo?.name || 'Phòng chơi'}
                  </h1>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    {currentRoom?.passwordHash && (
                      <span className="flex items-center gap-1">
                        🔒 Có mật khẩu
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      ⏱️ Thời gian mỗi lượt: {turnTimeLimit}s
                    </span>
                  </div>
                </div>
                {gameResult ? (
                  /* Hiển thị kết quả game */
                  <div className={`flex items-center justify-center px-4 py-2 rounded-lg border-2 ${
                    gameResult === 'win' 
                      ? 'bg-green-100 border-green-400' 
                      : gameResult === 'lose' 
                        ? 'bg-red-100 border-red-400' 
                        : 'bg-yellow-100 border-yellow-400'
                  }`}>
                    <span className={`text-xl font-bold ${
                      gameResult === 'win' 
                        ? 'text-green-600' 
                        : gameResult === 'lose' 
                          ? 'text-red-600' 
                          : 'text-yellow-600'
                    }`}>
                      {gameResultMessage || (gameResult === 'win' ? 'Bạn thắng!' : gameResult === 'lose' ? 'Bạn thua!' : 'Hòa!')}
                    </span>
                  </div>
                ) : isPlaying && gameStartTime && (
                  <div className="flex items-center gap-6">
                    {/* Thời gian đã chơi */}
                    <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border-2 border-blue-200">
                      <span className="text-sm font-medium text-blue-700">⏱️ Thời gian:</span>
                      <span className="text-xl font-bold text-blue-600">{formatGameDuration()}</span>
                    </div>
                    {/* Thời gian còn lại */}
                    {turnTimeRemaining !== null && (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${
                        turnTimeRemaining <= 10 
                          ? 'bg-red-100 border-red-400 animate-blink-warning' 
                          : turnTimeRemaining > turnTimeLimit * 0.5 
                            ? 'bg-green-50 border-green-200' 
                            : turnTimeRemaining > turnTimeLimit * 0.25 
                              ? 'bg-yellow-50 border-yellow-200' 
                              : 'bg-orange-50 border-orange-200'
                      }`}>
                        <span className={`text-sm font-medium ${
                          turnTimeRemaining <= 10 
                            ? 'text-red-700' 
                            : turnTimeRemaining > turnTimeLimit * 0.5 
                              ? 'text-green-700' 
                              : turnTimeRemaining > turnTimeLimit * 0.25 
                                ? 'text-yellow-700' 
                                : 'text-orange-700'
                        }`}>
                          ⏳ Lượt đi:
                        </span>
                        <span className={`text-2xl font-bold ${
                          turnTimeRemaining <= 10 
                            ? 'text-red-600 animate-blink-warning' 
                            : turnTimeRemaining > turnTimeLimit * 0.5 
                              ? 'text-green-600' 
                              : turnTimeRemaining > turnTimeLimit * 0.25 
                                ? 'text-yellow-600' 
                                : 'text-orange-600'
                        }`}>
                          {Math.max(0, turnTimeRemaining)}s
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Game Control Buttons */}
              {!isPlaying && (
                <>
                  {(() => {
                    if (!player) {
                      console.warn('Không tìm thấy người chơi trong phòng cho nút ready:', { userId, roomId, players: currentRoom?.players });
                      return (
                        <button
                          onClick={() => {
                            toast.info('Đang kết nối lại với phòng...');
                            gameSocket.joinRoom(roomId, '');
                          }}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                        >
                          Kết nối lại
                        </button>
                      );
                    }
                    
                    // Chủ phòng: hiển thị nút Chỉnh sửa và Bắt đầu game
                    if (isHost) {
                      const nonHostPlayers = currentRoom?.players?.filter(p => !p.isHost && !p.isDisconnected) || [];
                      const allNonHostReady = nonHostPlayers.length > 0 && nonHostPlayers.every(p => p.isReady);
                      const canStart = currentRoom?.players?.length >= 2 && allNonHostReady;
                      
                      return (
                        <>
                          <button
                            onClick={() => setShowRoomSettingsModal(true)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={handleStartGame}
                            disabled={!canStart}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!canStart ? (currentRoom?.players?.length < 2 ? 'Cần ít nhất 2 người chơi' : 'Tất cả người chơi (trừ chủ phòng) phải sẵn sàng') : 'Bắt đầu game'}
                          >
                            Bắt đầu game
                          </button>
                        </>
                      );
                    }
                    
                    // Non-host: hiển thị nút Sẵn sàng
                    return (
                      <button
                        onClick={handleReady}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          player.isReady
                            ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {player.isReady ? 'Hủy sẵn sàng' : 'Sẵn sàng'}
                      </button>
                    );
                  })()}
                </>
              )}
              {isPlaying && !isGameOver && (
                <>
                  <button
                    onClick={handleRequestDraw}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Xin hòa
                  </button>
                  <button
                    onClick={handleSurrender}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Đầu hàng
                  </button>
                </>
              )}
              <button
                onClick={handleLeaveRoom}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Rời phòng
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <GameBoard onCellClick={handleCellClick} disabled={!isMyTurn || isGameOver} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <PlayerList playerMarks={playerMarks} />
            
            {/* Lịch sử nước đi */}
            {isPlaying && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-2">Lịch sử nước đi</h3>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {history && history.length > 0 ? (
                    history.map((move, index) => (
                      <div
                        key={index}
                        className="p-2 rounded text-sm bg-gray-50"
                      >
                        <span className="font-semibold">#{index + 1}</span> - {move.mark} tại ({move.x}, {move.y})
                        {(move.nickname || move.username) && (
                          <span className="text-gray-500 ml-2">- {move.nickname || move.username}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Chưa có nước đi nào</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Chat Box */}
            <ChatBox roomId={roomId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
