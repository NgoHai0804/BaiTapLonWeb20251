import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { gameSocket } from '../../services/socket/gameSocket';
import { socketClient } from '../../services/socket/socketClient';
import { useGameState } from '../../hooks/useGameState';
import { useAuth } from '../../hooks/useAuth';
import { useCountdown } from '../../hooks/useCountdown';
import { setCurrentRoom, updateRoom, clearCurrentRoom } from '../../store/roomSlice';
import { setRoom, setMove, setWinner, setDraw, resetGame, clearGame } from '../../store/gameSlice';
import GameBoard from '../../components/GameBoard/GameBoard';
import PlayerList from '../../components/PlayerList/PlayerList';
import PasswordModal from '../../components/PasswordModal/PasswordModal';
import ChatBox from '../../components/ChatBox/ChatBox';
import { roomApi } from '../../services/api/roomApi';
import { ROOM_STATUS, TIME_LIMIT, SOCKET_EVENTS } from '../../utils/constants';
import { playSound } from '../../utils/soundManager';

const GameRoom = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { currentRoom } = useSelector((state) => state.room);
  const { board, isGameOver, winner, currentPlayerIndex, players, history } = useGameState();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [hasCheckedReconnect, setHasCheckedReconnect] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [pingTimeoutRemaining, setPingTimeoutRemaining] = useState(30);
  
  // Ping interval khi đang chơi
  const pingIntervalRef = useRef(null);
  const pingTimeoutRef = useRef(null);
  
  const startPingInterval = () => {
    // Xóa interval cũ nếu có
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    // Ping mỗi 10 giây khi đang chơi
    pingIntervalRef.current = setInterval(() => {
      const currentRoomState = currentRoom;
      const isPlayingState = currentRoomState?.status === ROOM_STATUS.PLAYING;
      if (isPlayingState && hasJoined && roomId) {
        gameSocket.pingRoom(roomId);
      }
    }, 10000); // 10 giây
  };

  const stopPingInterval = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  // Tự động set hasJoined nếu đã có currentRoom (có thể từ Redux store hoặc reconnect)
  useEffect(() => {
    if (currentRoom && currentRoom._id === roomId && !hasJoined) {
      console.log('✅ Auto-set hasJoined from currentRoom');
      setHasJoined(true);
    }
  }, [currentRoom, roomId, hasJoined]);

  // Kiểm tra phòng và xử lý password - chỉ chạy 1 lần khi mount
  useEffect(() => {
    // Tránh join nhiều lần
    if (hasJoined || isJoining || currentRoom) {
      return;
    }

    const checkRoomAndJoin = async () => {
      if (!roomId) {
        navigate('/lobby');
        return;
      }

      setIsJoining(true);

      try {
        // Lấy thông tin phòng từ danh sách
        const rooms = await roomApi.getRooms();
        const room = Array.isArray(rooms) 
          ? rooms.find(r => (r._id === roomId) || (r._id?.toString() === roomId))
          : null;

        if (!room) {
          toast.error('Không tìm thấy phòng');
          navigate('/lobby');
          setIsJoining(false);
          return;
        }

        setRoomInfo(room);

        // Kiểm tra xem có password từ sessionStorage không (từ RoomCard hoặc CreateRoom)
        const savedPassword = sessionStorage.getItem(`room_password_${roomId}`);
        // Kiểm tra password từ location state (từ RoomCard)
        const passwordFromState = location?.state?.password;
        const passwordToUse = savedPassword || passwordFromState;
        
        if (room.passwordHash) {
          // Phòng có mật khẩu
          if (passwordToUse) {
            // Đã có password từ RoomCard hoặc CreateRoom, join luôn
            sessionStorage.removeItem(`room_password_${roomId}`);
            gameSocket.joinRoom(roomId, passwordToUse);
            // Không set hasJoined ở đây, đợi join_success
          } else {
            // Chưa có password, hiển thị modal
            setShowPasswordModal(true);
            setIsJoining(false);
          }
        } else {
          // Phòng không có mật khẩu, join luôn với password rỗng
          gameSocket.joinRoom(roomId, '');
          // Không set hasJoined ở đây, đợi join_success
        }
      } catch (error) {
        console.error('Error checking room:', error);
        toast.error('Không thể tải thông tin phòng');
        navigate('/lobby');
        setIsJoining(false);
      }
    };

    checkRoomAndJoin();
  }, [roomId]); // Chỉ phụ thuộc vào roomId

  // Xử lý password modal submit
  const handlePasswordSubmit = (password) => {
    if (isJoining || hasJoined) {
      return; // Tránh submit nhiều lần
    }
    setShowPasswordModal(false);
    setIsJoining(true);
    gameSocket.joinRoom(roomId, password);
    // Không set hasJoined ở đây, đợi join_success
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    navigate('/lobby');
  };

  // Handle room pong - định nghĩa bên ngoài useEffect để có thể sử dụng trong dependency array
  const handleRoomPong = useCallback((data) => {
    // Cập nhật thời gian còn lại trước khi timeout
    if (data.timeRemaining !== undefined) {
      setPingTimeoutRemaining(data.timeRemaining / 1000); // Convert to seconds
    }
  }, []);

  // Socket event handlers - Đăng ký ngay khi component mount, không đợi hasJoined
  useEffect(() => {
    // Reconnect handlers
    const handleReconnectCheck = (data) => {
      if (data.inRoom && data.room) {
        console.log('🔄 Reconnect check: User is in room', data.room._id, 'gameState:', data.gameState);
        // Chỉ cập nhật nếu chưa join hoặc room khác
        if (!hasJoined || currentRoom?._id !== data.room._id) {
          dispatch(setCurrentRoom(data.room));
          dispatch(setRoom({ roomId: data.room._id, players: data.room.players || [] }));
          
          // Nếu có game state, khôi phục lại
          if (data.gameState && data.room.status === ROOM_STATUS.PLAYING) {
            dispatch(setMove({
              board: data.gameState.board,
              turn: data.gameState.turn,
              currentPlayerIndex: data.gameState.currentPlayerIndex,
              history: data.gameState.history || [],
            }));
          }
          
          setHasJoined(true);
          setIsJoining(false);
          // Không hiển thị toast cho reconnect check
        }
      }
    };

    const handleReconnectSuccess = (data) => {
      const room = data.room || data;
      console.log('✅ Reconnect success:', room._id, 'gameState:', data.gameState);
      // Chỉ cập nhật nếu chưa join hoặc room khác
      if (!hasJoined || currentRoom?._id !== room._id) {
        dispatch(setCurrentRoom(room));
        dispatch(setRoom({ roomId: room._id, players: room.players || [] }));
        
        // Nếu có game state, khôi phục lại
        if (data.gameState && room.status === ROOM_STATUS.PLAYING) {
          dispatch(setMove({
            board: data.gameState.board,
            turn: data.gameState.turn,
            currentPlayerIndex: data.gameState.currentPlayerIndex,
            history: data.gameState.history || [],
          }));
        }
        
        setHasJoined(true);
        setIsJoining(false);
        // Không hiển thị toast cho reconnect success
      }
    };

    const handlePlayerDisconnected = (data) => {
      dispatch(updateRoom(data.room));
      dispatch(setRoom({ roomId, players: data.room.players }));
      // Không hiển thị toast cho disconnect (quá nhiều thông báo)
    };

    const handlePlayerReconnected = (data) => {
      dispatch(updateRoom(data.room));
      dispatch(setRoom({ roomId, players: data.room.players }));
      // Không hiển thị toast cho reconnect (quá nhiều thông báo)
    };

    // Join room handlers
    const handleJoinSuccess = (data) => {
      const room = data.room || data;
      dispatch(setCurrentRoom(room));
      dispatch(setRoom({ roomId, players: room.players || [] }));
      setShowPasswordModal(false);
      setHasJoined(true);
      setIsJoining(false); // Reset joining flag
      // Không hiển thị toast cho join success
    };

    const handleJoinError = (data) => {
      const errorMessage = data.message || 'Không thể tham gia phòng';
      setIsJoining(false); // Reset joining flag
      toast.error(errorMessage);
      
      // Nếu lỗi do sai mật khẩu, hiển thị lại modal
      if (errorMessage.includes('mật khẩu') || errorMessage.includes('password') || errorMessage.includes('Sai')) {
        setShowPasswordModal(true);
        setHasJoined(false);
        // Xóa password đã lưu nếu có
        sessionStorage.removeItem(`room_password_${roomId}`);
      } else {
        navigate('/lobby');
      }
    };

    const handleRoomUpdate = (data) => {
      dispatch(updateRoom(data.room));
      dispatch(setRoom({ roomId, players: data.room.players }));
      // Không hiển thị toast cho room update
    };

    const handlePlayerJoined = (data) => {
      dispatch(updateRoom(data.room));
      dispatch(setRoom({ roomId, players: data.room.players }));
      // Không hiển thị toast cho player joined
    };

    const handlePlayerLeft = (data) => {
      dispatch(updateRoom(data.room));
      dispatch(setRoom({ roomId, players: data.room.players }));
      // Không hiển thị toast cho player left
    };

    const handlePlayerReadyStatus = (data) => {
      dispatch(updateRoom(data.room));
      dispatch(setRoom({ roomId, players: data.room.players }));
      // Không hiển thị toast cho ready status
    };

    const handleGameStart = (data) => {
      // Reset game state khi bắt đầu game mới
      dispatch(resetGame());
      dispatch(setRoom({ roomId, players: data.players }));
      dispatch(updateRoom(data.room));
      // Không hiển thị toast cho game start (đã có visual feedback từ UI)
      playSound('click');
      
      // Lưu thời gian bắt đầu game
      setGameStartTime(Date.now());
      setPingTimeoutRemaining(30);
      
      // Bắt đầu ping khi game bắt đầu
      startPingInterval();
    };

    const handleMoveMade = (data) => {
      dispatch(setMove({
        x: data.x,
        y: data.y,
        mark: data.mark,
        board: data.board,
        turn: data.turn,
        currentPlayerIndex: data.currentPlayerIndex,
        history: data.history,
        lastMove: data.lastMove, // Lưu nước đi cuối cùng
      }));
    };

    const handleGameEnd = (data) => {
      // Dừng ping khi game kết thúc
      stopPingInterval();
      if (pingTimeoutRef.current) {
        clearInterval(pingTimeoutRef.current);
        pingTimeoutRef.current = null;
      }
      setGameStartTime(null);
      
      if (data.result.winner) {
        dispatch(setWinner({
          winner: data.result.winner,
          winnerMark: data.result.winnerMark,
        }));
        // Chỉ hiển thị toast một lần
        toast.success(data.result.message || 'Game kết thúc!');
        // Phát âm thanh thắng/thua
        const userId = user?.id || user?._id;
        const winnerId = data.result.winner?.toString();
        const userStr = userId?.toString();
        if (winnerId === userStr) {
          playSound('win');
        } else {
          playSound('lose');
        }
      } else {
        dispatch(setDraw());
        // Chỉ hiển thị toast một lần
        toast.info('Hòa!');
        playSound('draw');
      }
    };

    const handleDrawRequested = (data) => {
      const userId = user?.id || user?._id;
      const requesterId = data.requesterId?.toString();
      const userStr = userId?.toString();
      
      // Chỉ xử lý nếu không phải người gửi yêu cầu (người nhận)
      if (requesterId !== userStr) {
        const acceptDraw = window.confirm(`${data.requesterUsername || 'Đối thủ'} muốn xin hòa. Bạn có đồng ý không?`);
        if (acceptDraw) {
          gameSocket.respondDraw(roomId, true);
        } else {
          gameSocket.respondDraw(roomId, false);
        }
      }
      // Người gửi không cần hiển thị toast, chỉ cần đợi phản hồi
    };

    const handleDrawAccepted = (data) => {
      // Không hiển thị toast riêng, vì game_end đã có thông báo
    };

    const handleDrawRejected = (data) => {
      // Chỉ hiển thị toast cho người gửi yêu cầu
      const userId = user?.id || user?._id;
      const rejectorId = data.rejectorId?.toString();
      const userStr = userId?.toString();
      
      // Nếu không phải người từ chối (tức là người gửi yêu cầu)
      if (rejectorId !== userStr) {
        toast.info('Đối thủ đã từ chối xin hòa');
      }
    };

    const handleDrawError = (data) => {
      toast.error(data.message || 'Lỗi khi xử lý yêu cầu xin hòa');
    };

    const handleBoardCleared = (data) => {
      dispatch(resetGame());
      dispatch(setMove({
        board: data.board,
        turn: data.turn,
        currentPlayerIndex: 0,
      }));
      dispatch(setCurrentRoom(data.room));
      dispatch(setRoom({ roomId, players: data.room.players || [] }));
      // Không hiển thị toast cho clear board
    };

    const handleClearBoardError = (data) => {
      toast.error(data.message || 'Lỗi khi xóa bàn cờ');
    };

    const handleRoomDeleted = (data) => {
      toast.warning(data.message || 'Phòng đã bị xóa');
      navigate('/lobby');
    };

    // Register listeners
    gameSocket.onJoinSuccess(handleJoinSuccess);
    gameSocket.onJoinError(handleJoinError);
    gameSocket.onRoomUpdate(handleRoomUpdate);
    gameSocket.onPlayerJoined(handlePlayerJoined);
    gameSocket.onPlayerLeft(handlePlayerLeft);
    gameSocket.onPlayerReadyStatus(handlePlayerReadyStatus);
    gameSocket.onGameStart(handleGameStart);
    gameSocket.onMoveMade(handleMoveMade);
    gameSocket.onGameEnd(handleGameEnd);
    gameSocket.onDrawRequested(handleDrawRequested);
    gameSocket.onDrawAccepted(handleDrawAccepted);
    gameSocket.onDrawRejected(handleDrawRejected);
    gameSocket.onDrawError(handleDrawError);
    gameSocket.onBoardCleared(handleBoardCleared);
    gameSocket.onClearBoardError(handleClearBoardError);
    gameSocket.onRoomDeleted(handleRoomDeleted);
    gameSocket.onReconnectCheck(handleReconnectCheck);
    gameSocket.onReconnectSuccess(handleReconnectSuccess);
    gameSocket.onPlayerDisconnected(handlePlayerDisconnected);
    gameSocket.onPlayerReconnected(handlePlayerReconnected);
    
    // Listen for room pong
    const socket = socketClient.getSocket();
    if (socket) {
      socket.on(SOCKET_EVENTS.ROOM_PONG, handleRoomPong);
    }

    // Kiểm tra reconnect khi socket kết nối - chỉ 1 lần
    if (socket && socket.connected && !hasCheckedReconnect && !hasJoined && !isJoining) {
      console.log('🔄 Checking for reconnect...');
      setHasCheckedReconnect(true);
      // Delay nhỏ để tránh conflict với join room
      setTimeout(() => {
        if (!hasJoined && !isJoining) {
          gameSocket.checkReconnect();
        }
      }, 500);
    }

    // Đăng ký callback để tự động kiểm tra reconnect khi socket kết nối lại - chỉ 1 lần
    const reconnectCallback = () => {
      if (!hasJoined && !isJoining && !hasCheckedReconnect) {
        console.log('🔄 Socket reconnected, checking for room...');
        setHasCheckedReconnect(true);
        setTimeout(() => {
          if (!hasJoined && !isJoining) {
            gameSocket.checkReconnect();
          }
        }, 500);
      }
    };
    
    socketClient.onReconnect(reconnectCallback);
    
    return () => {
      // Cleanup callback nếu cần
    };

    // Get game state if game is playing (sau khi đã join thành công)
    if (hasJoined && currentRoom?.status === ROOM_STATUS.PLAYING) {
      gameSocket.getGameState(roomId);
    }

    return () => {
      // Cleanup - chỉ cleanup nếu callback tồn tại
      if (handleJoinSuccess) gameSocket.offJoinSuccess(handleJoinSuccess);
      if (handleJoinError) gameSocket.offJoinError(handleJoinError);
      if (handleRoomUpdate) gameSocket.offRoomUpdate(handleRoomUpdate);
      if (handlePlayerJoined) gameSocket.offPlayerJoined(handlePlayerJoined);
      if (handlePlayerLeft) gameSocket.offPlayerLeft(handlePlayerLeft);
      if (handlePlayerReadyStatus) gameSocket.offPlayerReadyStatus(handlePlayerReadyStatus);
      if (handleGameStart) gameSocket.offGameStart(handleGameStart);
      if (handleMoveMade) gameSocket.offMoveMade(handleMoveMade);
      if (handleGameEnd) gameSocket.offGameEnd(handleGameEnd);
      if (handleDrawRequested) gameSocket.offDrawRequested(handleDrawRequested);
      if (handleDrawAccepted) gameSocket.offDrawAccepted(handleDrawAccepted);
      if (handleDrawRejected) gameSocket.offDrawRejected(handleDrawRejected);
      if (handleDrawError) gameSocket.offDrawError(handleDrawError);
      if (handleBoardCleared) gameSocket.offBoardCleared(handleBoardCleared);
      if (handleClearBoardError) gameSocket.offClearBoardError(handleClearBoardError);
      if (handleRoomDeleted) gameSocket.offRoomDeleted(handleRoomDeleted);
      if (handleReconnectCheck) gameSocket.offReconnectCheck(handleReconnectCheck);
      if (handleReconnectSuccess) gameSocket.offReconnectSuccess(handleReconnectSuccess);
      if (handlePlayerDisconnected) gameSocket.offPlayerDisconnected(handlePlayerDisconnected);
      if (handlePlayerReconnected) gameSocket.offPlayerReconnected(handlePlayerReconnected);
      
      // Remove room pong listener
      const socket = socketClient.getSocket();
      if (socket) {
        socket.off(SOCKET_EVENTS.ROOM_PONG, handleRoomPong);
      }
    };
  }, [roomId, hasJoined, currentRoom, navigate, dispatch, handleRoomPong]);

  const handleCellClick = (x, y) => {
    if (isGameOver) return;
    
    const currentPlayer = players?.[currentPlayerIndex];
    const userId = user?.id || user?._id;
    const playerUserId = currentPlayer?.userId?.toString();
    const userStr = userId?.toString();
    
    if (!currentPlayer || playerUserId !== userStr) {
      toast.warning('Chưa đến lượt bạn');
      return;
    }

    gameSocket.makeMove(roomId, x, y);
  };

  const handleReady = () => {
    const userId = user?.id || user?._id;
    const player = currentRoom?.players?.find(p => 
      p.userId?.toString() === userId?.toString() || p.userId === userId
    );
    if (player?.isReady) {
      gameSocket.playerReady(roomId, false);
    } else {
      gameSocket.playerReady(roomId, true);
    }
  };

  const handleStartGame = () => {
    const userId = user?.id || user?._id;
    const hostId = currentRoom?.hostId?.toString();
    const userStr = userId?.toString();
    
    if (hostId !== userStr) {
      toast.error('Chỉ chủ phòng mới có thể bắt đầu game');
      return;
    }
    gameSocket.startGame(roomId);
  };

  const handleRequestDraw = () => {
    if (window.confirm('Bạn có chắc muốn xin hòa?')) {
      gameSocket.requestDraw(roomId);
    }
  };

  const handleClearBoard = () => {
    if (window.confirm('Bạn có chắc muốn xóa bàn cờ để chơi ván mới?')) {
      gameSocket.clearBoard(roomId);
    }
  };

  const handleSurrender = () => {
    if (window.confirm('Bạn có chắc muốn đầu hàng?')) {
      gameSocket.surrenderGame(roomId);
    }
  };

  const handleLeaveRoom = () => {
    if (window.confirm('Bạn có chắc muốn rời phòng?')) {
      stopPingInterval();
      gameSocket.leaveRoom(roomId);
      dispatch(clearCurrentRoom());
      dispatch(clearGame());
      // Reset các flags
      setHasJoined(false);
      setIsJoining(false);
      setHasCheckedReconnect(false);
      navigate('/lobby');
    }
  };

  // Bắt đầu ping khi game bắt đầu, dừng khi game kết thúc
  useEffect(() => {
    const isPlayingState = currentRoom?.status === ROOM_STATUS.PLAYING;
    if (isPlayingState && hasJoined && roomId) {
      startPingInterval();
      
      // Start countdown timer cho ping timeout
      if (pingTimeoutRef.current) {
        clearInterval(pingTimeoutRef.current);
      }
      pingTimeoutRef.current = setInterval(() => {
        setPingTimeoutRemaining(prev => {
          if (prev <= 0) {
            return 30; // Reset to 30 when ping is received
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      stopPingInterval();
      if (pingTimeoutRef.current) {
        clearInterval(pingTimeoutRef.current);
        pingTimeoutRef.current = null;
      }
      setPingTimeoutRemaining(30);
    }
    
    return () => {
      stopPingInterval();
      if (pingTimeoutRef.current) {
        clearInterval(pingTimeoutRef.current);
        pingTimeoutRef.current = null;
      }
    };
  }, [currentRoom?.status, hasJoined, roomId]);
  
  // Format thời gian đã chơi
  const formatGameDuration = () => {
    if (!gameStartTime) return '00:00';
    const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      // Không disconnect socket ở đây vì có thể được dùng bởi components khác
      // Chỉ cleanup các flags
      stopPingInterval();
      setHasJoined(false);
      setIsJoining(false);
      setHasCheckedReconnect(false);
    };
  }, []);

  const userId = user?.id || user?._id;
  // Xác định chủ phòng: kiểm tra cả hostId và player.isHost
  const hostIdMatch = currentRoom?.hostId?.toString() === userId?.toString();
  const player = currentRoom?.players?.find(p => 
    p.userId?.toString() === userId?.toString() || p.userId === userId
  );
  const isHost = hostIdMatch || player?.isHost || false;
  const isPlaying = currentRoom?.status === ROOM_STATUS.PLAYING;
  const currentPlayer = players?.[currentPlayerIndex];
  const isMyTurn = currentPlayer?.userId?.toString() === userId?.toString();

  // Timer cho mỗi lượt đi
  const { timeLeft, start: startTimer, reset: resetTimer } = useCountdown(TIME_LIMIT, () => {
    if (isPlaying && isMyTurn && !isGameOver) {
      toast.warning('Hết thời gian! Lượt của bạn đã kết thúc.');
      // Có thể tự động đầu hàng hoặc bỏ lượt
    }
  });

  // Reset timer khi lượt chơi thay đổi
  useEffect(() => {
    if (isPlaying && isMyTurn && !isGameOver) {
      resetTimer(TIME_LIMIT);
      startTimer(TIME_LIMIT);
    } else {
      resetTimer(TIME_LIMIT);
    }
  }, [isMyTurn, isPlaying, isGameOver]);

  // Hiển thị loading nếu đang kiểm tra phòng
  if (!roomInfo) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Đang tải thông tin phòng...</p>
        </div>
      </div>
    );
  }

  // Nếu đã có currentRoom thì hiển thị nội dung (đã join thành công hoặc reconnect)
  // Chỉ hiển thị loading nếu chưa join, không có password modal, và không có currentRoom
  if (!currentRoom && !hasJoined && !showPasswordModal) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Đang tham gia phòng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Password Modal */}
        <PasswordModal
          isOpen={showPasswordModal}
          onClose={handlePasswordCancel}
          onSubmit={handlePasswordSubmit}
          roomName={roomInfo?.name || 'Phòng chơi'}
        />

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{currentRoom?.name || roomInfo?.name || 'Phòng chơi'}</h1>
                  <p className="text-gray-600 text-sm">
                    {isPlaying ? 'Đang chơi' : 'Đang chờ người chơi'}
                  </p>
                </div>
                {isPlaying && gameStartTime && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Thời gian:</span>
                      <span className="font-semibold text-blue-600">{formatGameDuration()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Kết nối:</span>
                      <span className={`font-semibold ${pingTimeoutRemaining > 10 ? 'text-green-600' : pingTimeoutRemaining > 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {Math.max(0, pingTimeoutRemaining)}s
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Rời phòng
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <GameBoard onCellClick={handleCellClick} disabled={!isMyTurn || isGameOver} />
            
            {isGameOver && (
              <div className="mt-4 bg-white rounded-lg shadow p-4 text-center">
                {winner ? (
                  <p className="text-2xl font-bold text-green-600">
                    {(() => {
                      const userId = user?.id || user?._id;
                      const winnerId = winner?.toString();
                      const userStr = userId?.toString();
                      return winnerId === userStr ? 'Bạn thắng!' : 'Bạn thua!';
                    })()}
                  </p>
                ) : (
                  <p className="text-2xl font-bold text-gray-600">Hòa!</p>
                )}
              </div>
            )}

            {/* Game Controls */}
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <div className="flex gap-2 flex-wrap">
                {!isPlaying && (
                  <>
                    {(() => {
                      const userId = user?.id || user?._id;
                      const player = currentRoom?.players?.find(p => 
                        p.userId?.toString() === userId?.toString() || p.userId === userId
                      );
                      // Chủ phòng không cần ready
                      if (player?.isHost) {
                        return null;
                      }
                      return (
                        <button
                          onClick={handleReady}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          {player?.isReady ? 'Hủy sẵn sàng' : 'Sẵn sàng'}
                        </button>
                      );
                    })()}
                    {/* Nút bắt đầu game cho chủ phòng - luôn hiển thị */}
                    {isHost && (
                      (() => {
                        // Kiểm tra xem tất cả player (trừ chủ phòng) đã ready chưa
                        const nonHostPlayers = currentRoom?.players?.filter(p => !p.isHost && !p.isDisconnected) || [];
                        const allNonHostReady = nonHostPlayers.length > 0 && nonHostPlayers.every(p => p.isReady);
                        const canStart = currentRoom?.players?.length >= 2 && allNonHostReady;
                        
                        return (
                          <button
                            onClick={handleStartGame}
                            disabled={!canStart}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!canStart ? (currentRoom?.players?.length < 2 ? 'Cần ít nhất 2 người chơi' : 'Tất cả người chơi (trừ chủ phòng) phải sẵn sàng') : 'Bắt đầu game'}
                          >
                            Bắt đầu game
                          </button>
                        );
                      })()
                    )}
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
                {isGameOver && (
                  <button
                    onClick={handleClearBoard}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Xóa bàn cờ
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <PlayerList />
            
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
                        {move.username && <span className="text-gray-500 ml-2">- {move.username}</span>}
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
