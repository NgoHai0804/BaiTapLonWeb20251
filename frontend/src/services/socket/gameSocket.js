import { socketClient } from './socketClient';
import { SOCKET_EVENTS } from '../../utils/constants';

export const gameSocket = {
  // Emit events
  joinRoom: (roomId, password = '') => {
    socketClient.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, password });
  },

  leaveRoom: (roomId) => {
    socketClient.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId });
  },

  playerReady: (roomId, isReady = true) => {
    socketClient.emit(SOCKET_EVENTS.PLAYER_READY, { roomId, isReady });
  },

  startGame: (roomId) => {
    socketClient.emit(SOCKET_EVENTS.START_GAME, { roomId });
  },

  makeMove: (roomId, x, y) => {
    socketClient.emit(SOCKET_EVENTS.MAKE_MOVE, { roomId, x, y });
  },

  undoMove: (roomId) => {
    socketClient.emit(SOCKET_EVENTS.UNDO_MOVE, { roomId });
  },

  resetGame: (roomId) => {
    socketClient.emit(SOCKET_EVENTS.RESET_GAME, { roomId });
  },

  getGameState: (roomId) => {
    socketClient.emit(SOCKET_EVENTS.GET_GAME_STATE, { roomId });
  },

  surrenderGame: (roomId) => {
    socketClient.emit(SOCKET_EVENTS.SURRENDER_GAME, { roomId });
  },

  requestDraw: (roomId) => {
    socketClient.emit(SOCKET_EVENTS.REQUEST_DRAW, { roomId });
  },

  respondDraw: (roomId, accept) => {
    socketClient.emit('respond_draw', { roomId, accept });
  },

  clearBoard: (roomId) => {
    socketClient.emit(SOCKET_EVENTS.CLEAR_BOARD, { roomId });
  },

  inviteToRoom: (roomId, friendId) => {
    socketClient.emit(SOCKET_EVENTS.INVITE_TO_ROOM, { roomId, friendId });
  },

  pingRoom: (roomId) => {
    socketClient.emit(SOCKET_EVENTS.PING_ROOM, { roomId });
  },

  // Listen events
  onJoinSuccess: (callback) => {
    socketClient.on(SOCKET_EVENTS.JOIN_SUCCESS, callback);
  },

  onJoinError: (callback) => {
    socketClient.on(SOCKET_EVENTS.JOIN_ERROR, callback);
  },

  onLeaveSuccess: (callback) => {
    socketClient.on(SOCKET_EVENTS.LEAVE_SUCCESS, callback);
  },

  onLeaveError: (callback) => {
    socketClient.on(SOCKET_EVENTS.LEAVE_ERROR, callback);
  },

  onRoomUpdate: (callback) => {
    socketClient.on(SOCKET_EVENTS.ROOM_UPDATE, callback);
  },

  onPlayerJoined: (callback) => {
    socketClient.on(SOCKET_EVENTS.PLAYER_JOINED, callback);
  },

  onPlayerLeft: (callback) => {
    socketClient.on(SOCKET_EVENTS.PLAYER_LEFT, callback);
  },

  onPlayerReadyStatus: (callback) => {
    socketClient.on(SOCKET_EVENTS.PLAYER_READY_STATUS, callback);
  },

  onGameStart: (callback) => {
    socketClient.on(SOCKET_EVENTS.GAME_START, callback);
  },

  onMoveMade: (callback) => {
    socketClient.on(SOCKET_EVENTS.MOVE_MADE, callback);
  },

  onMoveError: (callback) => {
    socketClient.on(SOCKET_EVENTS.MOVE_ERROR, callback);
  },

  onMoveUndone: (callback) => {
    socketClient.on(SOCKET_EVENTS.MOVE_UNDONE, callback);
  },

  onGameReset: (callback) => {
    socketClient.on(SOCKET_EVENTS.GAME_RESET, callback);
  },

  onGameEnd: (callback) => {
    socketClient.on(SOCKET_EVENTS.GAME_END, callback);
  },

  onDrawRequested: (callback) => {
    socketClient.on(SOCKET_EVENTS.DRAW_REQUESTED, callback);
  },

  onDrawAccepted: (callback) => {
    socketClient.on(SOCKET_EVENTS.DRAW_ACCEPTED, callback);
  },

  onDrawRejected: (callback) => {
    socketClient.on(SOCKET_EVENTS.DRAW_REJECTED, callback);
  },

  onDrawError: (callback) => {
    socketClient.on(SOCKET_EVENTS.DRAW_ERROR, callback);
  },

  onBoardCleared: (callback) => {
    socketClient.on(SOCKET_EVENTS.BOARD_CLEARED, callback);
  },

  onClearBoardError: (callback) => {
    socketClient.on(SOCKET_EVENTS.CLEAR_BOARD_ERROR, callback);
  },

  onGameState: (callback) => {
    socketClient.on(SOCKET_EVENTS.GAME_STATE, callback);
  },

  onRoomDeleted: (callback) => {
    socketClient.on(SOCKET_EVENTS.ROOM_DELETED, callback);
  },

  onPlayerDisconnected: (callback) => {
    socketClient.on(SOCKET_EVENTS.PLAYER_DISCONNECTED, callback);
  },

  onPlayerReconnected: (callback) => {
    socketClient.on(SOCKET_EVENTS.PLAYER_RECONNECTED, callback);
  },

  onReconnectCheck: (callback) => {
    socketClient.on(SOCKET_EVENTS.RECONNECT_CHECK, callback);
  },

  onReconnectSuccess: (callback) => {
    socketClient.on(SOCKET_EVENTS.RECONNECT_SUCCESS, callback);
  },

  checkReconnect: () => {
    socketClient.emit(SOCKET_EVENTS.CHECK_RECONNECT);
  },

  // Remove listeners
  offJoinSuccess: (callback) => {
    socketClient.off(SOCKET_EVENTS.JOIN_SUCCESS, callback);
  },

  offJoinError: (callback) => {
    socketClient.off(SOCKET_EVENTS.JOIN_ERROR, callback);
  },

  offRoomUpdate: (callback) => {
    socketClient.off(SOCKET_EVENTS.ROOM_UPDATE, callback);
  },

  offPlayerJoined: (callback) => {
    socketClient.off(SOCKET_EVENTS.PLAYER_JOINED, callback);
  },

  offPlayerLeft: (callback) => {
    socketClient.off(SOCKET_EVENTS.PLAYER_LEFT, callback);
  },

  offPlayerReadyStatus: (callback) => {
    socketClient.off(SOCKET_EVENTS.PLAYER_READY_STATUS, callback);
  },

  offGameStart: (callback) => {
    socketClient.off(SOCKET_EVENTS.GAME_START, callback);
  },

  offMoveMade: (callback) => {
    socketClient.off(SOCKET_EVENTS.MOVE_MADE, callback);
  },

  offGameEnd: (callback) => {
    socketClient.off(SOCKET_EVENTS.GAME_END, callback);
  },

  offDrawRequested: (callback) => {
    socketClient.off(SOCKET_EVENTS.DRAW_REQUESTED, callback);
  },

  offDrawAccepted: (callback) => {
    socketClient.off(SOCKET_EVENTS.DRAW_ACCEPTED, callback);
  },

  offDrawRejected: (callback) => {
    socketClient.off(SOCKET_EVENTS.DRAW_REJECTED, callback);
  },

  offDrawError: (callback) => {
    socketClient.off(SOCKET_EVENTS.DRAW_ERROR, callback);
  },

  offBoardCleared: (callback) => {
    socketClient.off(SOCKET_EVENTS.BOARD_CLEARED, callback);
  },

  offClearBoardError: (callback) => {
    socketClient.off(SOCKET_EVENTS.CLEAR_BOARD_ERROR, callback);
  },

  offGameReset: (callback) => {
    socketClient.off(SOCKET_EVENTS.GAME_RESET, callback);
  },

  offMoveUndone: (callback) => {
    socketClient.off(SOCKET_EVENTS.MOVE_UNDONE, callback);
  },

  offRoomDeleted: (callback) => {
    socketClient.off(SOCKET_EVENTS.ROOM_DELETED, callback);
  },

  offPlayerDisconnected: (callback) => {
    socketClient.off(SOCKET_EVENTS.PLAYER_DISCONNECTED, callback);
  },

  offPlayerReconnected: (callback) => {
    socketClient.off(SOCKET_EVENTS.PLAYER_RECONNECTED, callback);
  },

  offReconnectCheck: (callback) => {
    socketClient.off(SOCKET_EVENTS.RECONNECT_CHECK, callback);
  },

  offReconnectSuccess: (callback) => {
    socketClient.off(SOCKET_EVENTS.RECONNECT_SUCCESS, callback);
  },
};

export default gameSocket;
