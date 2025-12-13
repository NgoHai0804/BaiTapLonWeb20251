// useGameRoomSetup.js
// Hook xử lý việc setup và join vào phòng (trước khi chơi)
// Bao gồm: kiểm tra phòng, xử lý password, reconnect

import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { gameSocket } from '../services/socket/gameSocket';
import { socketClient } from '../services/socket/socketClient';
import { setCurrentRoom, updateRoom, clearCurrentRoom } from '../store/roomSlice';
import { setRoom, clearGame } from '../store/gameSlice';
import { updateProfile } from '../store/userSlice';
import { roomApi } from '../services/api/roomApi';
import { ROOM_STATUS, SOCKET_EVENTS } from '../utils/constants';
import { useAuth } from './useAuth';

export const useGameRoomSetup = (roomId) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { currentRoom } = useSelector((state) => state.room);
  
  const [roomInfo, setRoomInfo] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [hasCheckedReconnect, setHasCheckedReconnect] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [playerMarks, setPlayerMarks] = useState({});
  const [turnTimeLimit, setTurnTimeLimit] = useState(30);
  const [firstTurn, setFirstTurn] = useState('X');

  // Helper function để cập nhật user ELO từ room players
  const updateUserEloFromRoom = useCallback((room) => {
    if (!room?.players || !user) return;
    
    const userId = user?.id || user?._id;
    const currentPlayer = room.players.find(p => 
      p.userId?.toString() === userId?.toString() || 
      p.userId?._id?.toString() === userId?.toString()
    );
    
    if (currentPlayer && (currentPlayer.elo || currentPlayer.score)) {
      const newElo = currentPlayer.elo || currentPlayer.score;
      if (user.gameStats) {
        const caroStats = user.gameStats.find(s => s.gameId === 'caro') || user.gameStats[0];
        if (!caroStats || caroStats.score !== newElo) {
          const updatedGameStats = user.gameStats.map(stat => 
            stat.gameId === 'caro' || (!caroStats && stat === user.gameStats[0])
              ? { ...stat, score: newElo }
              : stat
          );
          if (!updatedGameStats.find(s => s.gameId === 'caro')) {
            updatedGameStats.push({ gameId: 'caro', score: newElo });
          }
          dispatch(updateProfile({ gameStats: updatedGameStats }));
          console.log('Đã cập nhật ELO user từ phòng:', newElo);
        }
      } else {
        dispatch(updateProfile({ 
          gameStats: [{ gameId: 'caro', score: newElo }] 
        }));
        console.log('Đã tạo ELO user từ phòng:', newElo);
      }
    }
  }, [user, dispatch]);

  // Tự động set hasJoined nếu đã có currentRoom
  useEffect(() => {
    if (currentRoom && currentRoom._id?.toString() === roomId && !hasJoined) {
      console.log('Tự động set hasJoined từ currentRoom');
      setHasJoined(true);
      if (!roomInfo) {
        setRoomInfo(currentRoom);
      }
    }
  }, [currentRoom, roomId, hasJoined, roomInfo]);

  // Kiểm tra phòng và xử lý password - chỉ chạy 1 lần khi mount
  useEffect(() => {
    if (hasJoined || isJoining) return;

    if (currentRoom && currentRoom._id?.toString() === roomId) {
      console.log('Đã có currentRoom, không cần check lại');
      setRoomInfo(currentRoom);
      setHasJoined(true);
      setIsJoining(false);
      return;
    }

    const checkRoomAndJoin = async () => {
      if (!roomId) {
        console.error('Không có roomId trong checkRoomAndJoin, đang chuyển hướng đến lobby');
        toast.error('Không tìm thấy thông tin phòng');
        navigate('/lobby');
        return;
      }

      setIsJoining(true);

      try {
        const userRoomCheck = await roomApi.checkUserRoom();
        const isUserInThisRoom = userRoomCheck?.inRoom && userRoomCheck?.room?._id?.toString() === roomId;

        if (isUserInThisRoom) {
          console.log('User đã ở trong phòng, đang tự động kết nối lại...');
          setRoomInfo(userRoomCheck.room);
          gameSocket.joinRoom(roomId, '');
          setIsJoining(false);
          return;
        }

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

        const userId = user?.id || user?._id;
        const isHost = room.hostId && room.hostId.toString() === userId?.toString();

        if (isHost) {
          console.log('User là chủ phòng, tham gia không cần mật khẩu');
          gameSocket.joinRoom(roomId, '');
          setIsJoining(false);
          return;
        }

        const savedPassword = sessionStorage.getItem(`room_password_${roomId}`);
        const passwordFromState = location?.state?.password;
        const passwordToUse = savedPassword || passwordFromState;
        
        if (room.passwordHash) {
          if (passwordToUse) {
            try {
              await roomApi.verifyPassword(roomId, passwordToUse);
              sessionStorage.removeItem(`room_password_${roomId}`);
              gameSocket.joinRoom(roomId, passwordToUse);
            } catch (error) {
              console.error('Xác thực mật khẩu thất bại:', error);
              sessionStorage.removeItem(`room_password_${roomId}`);
              setShowPasswordModal(true);
              setIsJoining(false);
            }
          } else {
            setShowPasswordModal(true);
            setIsJoining(false);
          }
        } else {
          gameSocket.joinRoom(roomId, '');
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra phòng:', error);
        toast.error('Không thể tải thông tin phòng');
        navigate('/lobby');
        setIsJoining(false);
      }
    };

    checkRoomAndJoin();
  }, [roomId]);

  // Xử lý password modal submit
  const handlePasswordSubmit = async (password) => {
    console.log('handlePasswordSubmit được gọi', { 
      roomId, 
      hasRoomInfo: !!roomInfo, 
      isJoining, 
      hasJoined,
      passwordLength: password?.length,
      hasPassword: !!password 
    });
    
    if (isJoining || hasJoined) {
      throw new Error('Đang xử lý, vui lòng đợi...');
    }
    
    if (!roomId) {
      console.error('Không có roomId trong handlePasswordSubmit');
      const error = new Error('Không có thông tin phòng');
      setShowPasswordModal(false);
      navigate('/lobby');
      throw error;
    }

    if (!password && password !== '') {
      console.error('Không có mật khẩu trong handlePasswordSubmit');
      throw new Error('Vui lòng nhập mật khẩu');
    }

    if (!roomInfo) {
      console.log('Không có roomInfo, đang thử tải lại...');
      try {
        const rooms = await roomApi.getRooms();
        const roomData = Array.isArray(rooms) 
          ? rooms.find(r => (r._id === roomId) || (r._id?.toString() === roomId))
          : null;
        
        if (roomData) {
          console.log('Đã tải dữ liệu phòng:', roomData._id);
          setRoomInfo(roomData);
        } else {
          console.warn('Không tìm thấy phòng trong danh sách, nhưng vẫn tiếp tục xác thực...');
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin phòng:', error);
      }
    }

    setIsJoining(true);
    
    try {
      console.log('Đang xác thực mật khẩu cho phòng:', roomId, 'độ dài mật khẩu:', password?.length);
      await roomApi.verifyPassword(roomId, password || '');
      console.log('Xác thực mật khẩu thành công');
      setShowPasswordModal(false);
      gameSocket.joinRoom(roomId, password || '');
      console.log('Đã gọi socket join room');
    } catch (error) {
      setIsJoining(false);
      console.error('Xác thực mật khẩu thất bại:', error);
      console.error('Chi tiết lỗi:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.message || error.message || 'Mật khẩu không đúng';
      throw new Error(errorMessage);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    navigate('/lobby');
  };

  // Socket event handlers cho setup
  useEffect(() => {
    const handleReconnectCheck = (data) => {
      if (data.inRoom && data.room) {
        console.log('Kiểm tra kết nối lại: User đang ở trong phòng', data.room._id, 'gameState:', data.gameState);
        if (!hasJoined || currentRoom?._id !== data.room._id) {
          dispatch(setCurrentRoom(data.room));
          dispatch(setRoom({ roomId: data.room._id, players: data.room.players || [] }));
          updateUserEloFromRoom(data.room);
          
          if (data.room.playerMarks) {
            const playerMarksObj = data.room.playerMarks instanceof Map 
              ? Object.fromEntries(data.room.playerMarks) 
              : data.room.playerMarks;
            setPlayerMarks(playerMarksObj);
          }
          if (data.room.firstTurn) {
            setFirstTurn(data.room.firstTurn);
          }
          if (data.room.turnTimeLimit) {
            setTurnTimeLimit(data.room.turnTimeLimit);
          }
          
          if (data.gameState && data.room.status === ROOM_STATUS.PLAYING) {
            dispatch(setRoom({
              roomId: data.room._id,
              players: data.room.players || [],
            }));
          } else if (data.room.status === ROOM_STATUS.PLAYING && !data.gameState) {
            console.log('Game đang chơi nhưng không có game state, đang tải lại...');
            setTimeout(() => {
              gameSocket.getGameState(data.room._id);
            }, 500);
          }
          
          setHasJoined(true);
          setIsJoining(false);
        }
      }
    };

    const handleReconnectSuccess = (data) => {
      const room = data.room || data;
      console.log('Kết nối lại thành công:', room._id, 'gameState:', data.gameState);
      if (!hasJoined || currentRoom?._id !== room._id) {
        dispatch(setCurrentRoom(room));
        dispatch(setRoom({ roomId: room._id, players: room.players || [] }));
        updateUserEloFromRoom(room);
        
        if (room.playerMarks) {
          const playerMarksObj = room.playerMarks instanceof Map 
            ? Object.fromEntries(room.playerMarks) 
            : room.playerMarks;
          setPlayerMarks(playerMarksObj);
        }
        if (room.firstTurn) {
          setFirstTurn(room.firstTurn);
        }
        if (room.turnTimeLimit) {
          setTurnTimeLimit(room.turnTimeLimit);
        }
        
        if (data.gameState && room.status === ROOM_STATUS.PLAYING) {
          dispatch(setRoom({
            roomId: room._id,
            players: room.players || [],
          }));
        } else if (room.status === ROOM_STATUS.PLAYING && !data.gameState) {
          console.log('Game đang chơi nhưng không có game state, đang tải lại...');
          setTimeout(() => {
            gameSocket.getGameState(room._id);
          }, 500);
        }
        
        setHasJoined(true);
        setIsJoining(false);
      }
    };

    const handleJoinSuccess = (data) => {
      const room = data.room || data;
      console.log('Tham gia thành công:', { 
        roomId, 
        room: room._id, 
        players: room.players?.length,
        playerIds: room.players?.map(p => p.userId?.toString()),
        playerMarks: room.playerMarks,
        firstTurn: room.firstTurn
      });
      dispatch(setCurrentRoom(room));
      dispatch(setRoom({ roomId, players: room.players || [] }));
      updateUserEloFromRoom(room);
      
      if (room.playerMarks) {
        const playerMarksObj = room.playerMarks instanceof Map 
          ? Object.fromEntries(room.playerMarks) 
          : room.playerMarks;
        setPlayerMarks(playerMarksObj);
        console.log('Đã cập nhật playerMarks từ phòng:', playerMarksObj);
      }
      if (room.firstTurn) {
        setFirstTurn(room.firstTurn);
        console.log('Đã cập nhật firstTurn từ phòng:', room.firstTurn);
      }
      if (room.turnTimeLimit) {
        setTurnTimeLimit(room.turnTimeLimit);
        console.log('Đã cập nhật turnTimeLimit từ phòng:', room.turnTimeLimit);
      }
      
      setShowPasswordModal(false);
      setHasJoined(true);
      setIsJoining(false);
    };

    const handleJoinError = (data) => {
      const errorMessage = data.message || 'Không thể tham gia phòng';
      setIsJoining(false);
      toast.error(errorMessage);
      
      if (errorMessage.includes('mật khẩu') || errorMessage.includes('password') || errorMessage.includes('Sai')) {
        setShowPasswordModal(true);
        setHasJoined(false);
        sessionStorage.removeItem(`room_password_${roomId}`);
      } else {
        navigate('/lobby');
      }
    };

    const handleRoomUpdate = (data) => {
      console.log('Cập nhật phòng:', { roomId, players: data.room.players?.length, room: data.room._id });
      dispatch(updateRoom(data.room));
      dispatch(setRoom({ roomId, players: data.room.players }));
      updateUserEloFromRoom(data.room);
      
      if (data.room.playerMarks) {
        const playerMarksObj = data.room.playerMarks instanceof Map 
          ? Object.fromEntries(data.room.playerMarks) 
          : data.room.playerMarks;
        setPlayerMarks(playerMarksObj);
      }
      if (data.room.firstTurn) {
        setFirstTurn(data.room.firstTurn);
      }
      if (data.room.turnTimeLimit) {
        setTurnTimeLimit(data.room.turnTimeLimit);
      }
    };

    const handlePlayerJoined = (data) => {
      console.log('Người chơi đã tham gia:', { roomId, players: data.room.players?.length });
      dispatch(updateRoom(data.room));
      dispatch(setRoom({ roomId, players: data.room.players }));
      const playerName = data.nickname || data.username || 'Người chơi';
      toast.info(data.message || `${playerName} đã tham gia phòng`, {
        position: "top-right",
        autoClose: 3000,
      });
    };

    const handlePlayerLeft = (data) => {
      dispatch(updateRoom(data.room));
      dispatch(setRoom({ roomId, players: data.room.players }));
      const playerName = data.nickname || data.username || 'Người chơi';
      toast.warning(data.message || `${playerName} đã rời phòng`, {
        position: "top-right",
        autoClose: 3000,
      });
    };

    const handlePlayerDisconnected = (data) => {
      dispatch(updateRoom(data.room));
      dispatch(setRoom({ roomId, players: data.room.players }));
    };

    const handlePlayerReconnected = (data) => {
      dispatch(updateRoom(data.room));
      dispatch(setRoom({ roomId, players: data.room.players }));
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
    gameSocket.onPlayerDisconnected(handlePlayerDisconnected);
    gameSocket.onPlayerReconnected(handlePlayerReconnected);
    gameSocket.onReconnectCheck(handleReconnectCheck);
    gameSocket.onReconnectSuccess(handleReconnectSuccess);
    gameSocket.onRoomDeleted(handleRoomDeleted);

    // Kiểm tra reconnect khi socket kết nối
    const socket = socketClient.getSocket();
    if (socket && socket.connected && !hasCheckedReconnect && !hasJoined && !isJoining) {
      console.log('Đang kiểm tra kết nối lại...');
      setHasCheckedReconnect(true);
      setTimeout(() => {
        if (!hasJoined && !isJoining) {
          gameSocket.checkReconnect();
        }
      }, 500);
    }

    const reconnectCallback = () => {
      console.log('Socket đã kết nối lại, đang kiểm tra phòng và game state...');
      setTimeout(() => {
        gameSocket.checkReconnect();
        if (hasJoined && currentRoom?.status === ROOM_STATUS.PLAYING) {
          console.log('Game đang chơi, đang tải game state...');
          gameSocket.getGameState(roomId);
        }
      }, 500);
    };
    
    socketClient.onReconnect(reconnectCallback);

    return () => {
      console.log('Đang dọn dẹp socket listeners cho useGameRoomSetup');
      try {
        gameSocket.offJoinSuccess(handleJoinSuccess);
        gameSocket.offJoinError(handleJoinError);
        gameSocket.offRoomUpdate(handleRoomUpdate);
        gameSocket.offPlayerJoined(handlePlayerJoined);
        gameSocket.offPlayerLeft(handlePlayerLeft);
        gameSocket.offPlayerDisconnected(handlePlayerDisconnected);
        gameSocket.offPlayerReconnected(handlePlayerReconnected);
        gameSocket.offReconnectCheck(handleReconnectCheck);
        gameSocket.offReconnectSuccess(handleReconnectSuccess);
        gameSocket.offRoomDeleted(handleRoomDeleted);
      } catch (error) {
        console.error('Lỗi khi dọn dẹp socket listeners:', error);
      }
    };
  }, [roomId, hasJoined, isJoining, hasCheckedReconnect, currentRoom, dispatch, navigate, updateUserEloFromRoom]);

  return {
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
  };
};

export default useGameRoomSetup;

