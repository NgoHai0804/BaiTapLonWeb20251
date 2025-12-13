// useGameRoomPlaying.js
// Hook xử lý logic khi đang chơi
// Bao gồm: moves, timer, draw, surrender, ping

import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { gameSocket } from '../services/socket/gameSocket';
import { socketClient } from '../services/socket/socketClient';
import { setMove, resetGame, setRoom } from '../store/gameSlice';
import { updateRoom } from '../store/roomSlice';
import { ROOM_STATUS, SOCKET_EVENTS } from '../utils/constants';
import { playSound } from '../utils/soundManager';
import { useAuth } from './useAuth';

export const useGameRoomPlaying = (roomId, hasJoined, currentRoom, setPlayerMarks, setTurnTimeLimit, setFirstTurn) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { board, isGameOver, currentPlayerIndex, players } = useSelector((state) => state.game);
  
  const [gameStartTime, setGameStartTime] = useState(null);
  const [pingTimeoutRemaining, setPingTimeoutRemaining] = useState(30);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState(null);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);
  const [drawRequestInfo, setDrawRequestInfo] = useState(null);
  
  const turnStartTimeRef = useRef(null);
  const turnTimerRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const pingTimeoutRef = useRef(null);

  // Bắt đầu gửi ping định kỳ
  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    pingIntervalRef.current = setInterval(() => {
      const isPlayingState = currentRoom?.status === ROOM_STATUS.PLAYING;
      if (isPlayingState && hasJoined && roomId) {
        gameSocket.pingRoom(roomId);
      }
    }, 10000);
  }, [currentRoom, hasJoined, roomId]);

  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Hàm quản lý timer cho lượt chơi
  const startTurnTimer = useCallback((serverTurnStartTime, timeLimit) => {
    if (turnTimerRef.current) {
      clearInterval(turnTimerRef.current);
    }
    
    const actualTurnStartTime = serverTurnStartTime || Date.now();
    turnStartTimeRef.current = actualTurnStartTime;
    
    const elapsed = Math.floor((Date.now() - actualTurnStartTime) / 1000);
    const remaining = Math.max(0, timeLimit - elapsed);
    setTurnTimeRemaining(remaining);
    
    turnTimerRef.current = setInterval(() => {
      if (!turnStartTimeRef.current) return;
      
      const currentElapsed = Math.floor((Date.now() - turnStartTimeRef.current) / 1000);
      const currentRemaining = Math.max(0, timeLimit - currentElapsed);
      setTurnTimeRemaining(currentRemaining);
      
      if (currentRemaining <= 0) {
        if (turnTimerRef.current) {
          clearInterval(turnTimerRef.current);
          turnTimerRef.current = null;
        }
      }
    }, 100);
  }, []);

  const stopTurnTimer = useCallback(() => {
    if (turnTimerRef.current) {
      clearInterval(turnTimerRef.current);
      turnTimerRef.current = null;
    }
    setTurnTimeRemaining(null);
  }, []);

  // Xử lý click vào ô cờ
  const handleCellClick = useCallback((x, y) => {
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
  }, [isGameOver, players, currentPlayerIndex, user, roomId]);

  // Xử lý xin hòa
  const handleRequestDraw = useCallback(() => {
    gameSocket.requestDraw(roomId);
  }, [roomId]);

  const handleDrawAccept = useCallback(() => {
    gameSocket.respondDraw(roomId, true);
  }, [roomId]);

  const handleDrawReject = useCallback(() => {
    gameSocket.respondDraw(roomId, false);
  }, [roomId]);

  const handleDrawCancel = useCallback(() => {
    gameSocket.cancelDraw(roomId);
    setShowDrawModal(false);
    setDrawRequestInfo(null);
    toast.info('Đã hủy yêu cầu xin hòa');
  }, [roomId]);

  // Xử lý đầu hàng
  const handleSurrender = useCallback(() => {
    setShowSurrenderModal(true);
  }, []);

  const handleConfirmSurrender = useCallback(() => {
    setShowSurrenderModal(false);
    gameSocket.surrenderGame(roomId);
  }, [roomId]);

  const handleCancelSurrender = useCallback(() => {
    setShowSurrenderModal(false);
  }, []);

  // Format thời gian đã chơi
  const formatGameDuration = useCallback(() => {
    if (!gameStartTime) return '00:00';
    const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [gameStartTime]);

  // Handle room pong
  const handleRoomPong = useCallback((data) => {
    if (data.timeRemaining !== undefined) {
      setPingTimeoutRemaining(data.timeRemaining / 1000);
    }
  }, []);

  // Socket event handlers cho playing
  const setupPlayingListeners = useCallback((onGameStart, onGameEnd) => {
    const handleGameStart = (data) => {
      console.log('Đã nhận sự kiện bắt đầu game:', data);
      dispatch(resetGame());
      dispatch(setRoom({ roomId, players: data.players }));
      dispatch(updateRoom(data.room));
      
      // Cập nhật playerMarks, turnTimeLimit và firstTurn
      if (data.playerMarks && setPlayerMarks) {
        setPlayerMarks(data.playerMarks);
        console.log('Dấu người chơi:', data.playerMarks);
      }
      if (data.turnTimeLimit && setTurnTimeLimit) {
        setTurnTimeLimit(data.turnTimeLimit);
      }
      if (data.firstTurn && setFirstTurn) {
        setFirstTurn(data.firstTurn);
      }
      
      if (data.board && data.turn !== undefined) {
        dispatch(setMove({
          board: data.board,
          turn: data.turn,
          currentPlayerIndex: data.currentPlayerIndex !== undefined ? data.currentPlayerIndex : 0,
          history: data.history || [],
        }));
        console.log('Game state đã được khởi tạo từ sự kiện game_start');
      } else {
        console.log('Không có game state trong sự kiện game_start, đang tải lại...');
        setTimeout(() => {
          gameSocket.getGameState(roomId);
        }, 100);
      }
      
      setGameStartTime(Date.now());
      setPingTimeoutRemaining(30);
      startPingInterval();
      
      if (data.turnTimeLimit && data.turnStartTime) {
        startTurnTimer(data.turnStartTime, data.turnTimeLimit);
      } else if (data.turnTimeLimit) {
        startTurnTimer(null, data.turnTimeLimit);
      }
      
      setShowDrawModal(false);
      setDrawRequestInfo(null);
      setShowSurrenderModal(false);
      playSound('click');
      
      if (onGameStart) onGameStart(data);
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
        lastMove: data.lastMove,
      }));
    };

    const handleTurnStarted = (data) => {
      console.log('Sự kiện lượt bắt đầu:', data);
      if (data.turnStartTime && data.turnTimeLimit) {
        startTurnTimer(data.turnStartTime, data.turnTimeLimit);
      }
    };

    const handleGameState = (data) => {
      console.log('Đã nhận game state:', data);
      if (data.room && data.room._id?.toString() === roomId) {
        dispatch(setRoom({ roomId: data.room._id, players: data.room.players || [] }));
        
        if (data.board && data.room.status === ROOM_STATUS.PLAYING) {
          dispatch(setMove({
            board: data.board,
            turn: data.turn,
            currentPlayerIndex: data.currentPlayerIndex,
            history: data.history || [],
          }));
          console.log('Game state đã được khôi phục');
        }
      }
    };

    const handleDrawRequested = (data) => {
      setDrawRequestInfo({
        requesterId: data.requesterId,
        requesterUsername: data.requesterUsername || 'Đối thủ',
        requesterNickname: data.requesterNickname || data.requesterUsername || 'Đối thủ',
      });
      setShowDrawModal(true);
    };

    const handleDrawAccepted = (data) => {
      setShowDrawModal(false);
      setDrawRequestInfo(null);
    };

    const handleDrawRejected = (data) => {
      setShowDrawModal(false);
      setDrawRequestInfo(null);
      
      const userId = user?.id || user?._id;
      const rejectorId = data.rejectorId?.toString();
      const userStr = userId?.toString();
      
      if (rejectorId !== userStr) {
        toast.info('Đối thủ đã từ chối xin hòa');
      }
    };

    const handleDrawCancelled = (data) => {
      console.log('Đã nhận sự kiện hủy xin hòa:', data);
      setShowDrawModal(false);
      setDrawRequestInfo(null);
      
      const userId = user?.id || user?._id;
      const requesterId = data.requesterId?.toString();
      const userStr = userId?.toString();
      
      if (requesterId !== userStr) {
        toast.info(data.message || 'Đối thủ đã hủy yêu cầu xin hòa');
      }
    };

    const handleDrawError = (data) => {
      setShowDrawModal(false);
      setDrawRequestInfo(null);
      toast.error(data.message || 'Lỗi khi xử lý yêu cầu xin hòa');
    };

    const handleSurrenderError = (data) => {
      console.error('Lỗi khi đầu hàng:', data);
      toast.error(data.message || 'Không thể đầu hàng');
      setShowSurrenderModal(false);
    };

    // Register listeners
    gameSocket.onGameStart(handleGameStart);
    gameSocket.onMoveMade(handleMoveMade);
    gameSocket.onTurnStarted(handleTurnStarted);
    gameSocket.onGameState(handleGameState);
    gameSocket.onDrawRequested(handleDrawRequested);
    gameSocket.onDrawCancelled(handleDrawCancelled);
    gameSocket.onDrawAccepted(handleDrawAccepted);
    gameSocket.onDrawRejected(handleDrawRejected);
    gameSocket.onDrawError(handleDrawError);
    gameSocket.onSurrenderError(handleSurrenderError);

    const socket = socketClient.getSocket();
    if (socket) {
      socket.on(SOCKET_EVENTS.ROOM_PONG, handleRoomPong);
    }

    return () => {
      gameSocket.offGameStart(handleGameStart);
      gameSocket.offMoveMade(handleMoveMade);
      gameSocket.offTurnStarted(handleTurnStarted);
      gameSocket.offGameState(handleGameState);
      gameSocket.offDrawRequested(handleDrawRequested);
      gameSocket.offDrawCancelled(handleDrawCancelled);
      gameSocket.offDrawAccepted(handleDrawAccepted);
      gameSocket.offDrawRejected(handleDrawRejected);
      gameSocket.offDrawError(handleDrawError);
      gameSocket.offSurrenderError(handleSurrenderError);
      
      if (socket) {
        socket.off(SOCKET_EVENTS.ROOM_PONG, handleRoomPong);
      }
    };
  }, [roomId, dispatch, user, startPingInterval, startTurnTimer, setPlayerMarks, setTurnTimeLimit, setFirstTurn]);

  // Bắt đầu ping khi game bắt đầu
  useEffect(() => {
    const isPlayingState = currentRoom?.status === ROOM_STATUS.PLAYING;
    if (isPlayingState && hasJoined && roomId) {
      startPingInterval();
      
      if (pingTimeoutRef.current) {
        clearInterval(pingTimeoutRef.current);
      }
      pingTimeoutRef.current = setInterval(() => {
        setPingTimeoutRemaining(prev => {
          if (prev <= 0) {
            return 30;
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
  }, [currentRoom?.status, hasJoined, roomId, startPingInterval, stopPingInterval]);

  return {
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
  };
};

export default useGameRoomPlaying;

