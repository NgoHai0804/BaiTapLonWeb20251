// constants.js
// Global constants

// Game constants
export const BOARD_SIZE = 20;
export const TIME_LIMIT = 30; // seconds per turn
export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;

// Socket events
export const SOCKET_EVENTS = {
  // Room events
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PLAYER_READY: 'player_ready',
  START_GAME: 'start_game',
  ROOM_UPDATE: 'room_update',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  PLAYER_READY_STATUS: 'player_ready_status',
  GAME_START: 'game_start',
  ROOM_DELETED: 'room_deleted',
  JOIN_SUCCESS: 'join_success',
  JOIN_ERROR: 'join_error',
  LEAVE_SUCCESS: 'leave_success',
  LEAVE_ERROR: 'leave_error',
  START_ERROR: 'start_error',
  READY_ERROR: 'ready_error',
  PLAYER_DISCONNECTED: 'player_disconnected',
  PLAYER_RECONNECTED: 'player_reconnected',
  CHECK_RECONNECT: 'check_reconnect',
  RECONNECT_CHECK: 'reconnect_check',
  RECONNECT_SUCCESS: 'reconnect_success',
  INVITE_TO_ROOM: 'invite_to_room',
  INVITE_SUCCESS: 'invite_success',
  INVITE_ERROR: 'invite_error',
  PING_ROOM: 'ping_room',
  ROOM_PONG: 'room_pong',
  
  // Game events
  MAKE_MOVE: 'make_move',
  MOVE_MADE: 'move_made',
  MOVE_ERROR: 'move_error',
  UNDO_MOVE: 'undo_move',
  MOVE_UNDONE: 'move_undone',
  UNDO_ERROR: 'undo_error',
  RESET_GAME: 'reset_game',
  GAME_RESET: 'game_reset',
  RESET_ERROR: 'reset_error',
  GET_GAME_STATE: 'get_game_state',
  GAME_STATE: 'game_state',
  GAME_STATE_ERROR: 'game_state_error',
  GAME_END: 'game_end',
  SURRENDER_GAME: 'surrender_game',
  SURRENDER_ERROR: 'surrender_error',
  REQUEST_DRAW: 'request_draw',
  DRAW_REQUESTED: 'draw_requested',
  DRAW_ACCEPTED: 'draw_accepted',
  DRAW_REJECTED: 'draw_rejected',
  DRAW_ERROR: 'draw_error',
  CLEAR_BOARD: 'clear_board',
  BOARD_CLEARED: 'board_cleared',
  CLEAR_BOARD_ERROR: 'clear_board_error',
  
  // Chat events
  SEND_MESSAGE: 'send_message',
  MESSAGE_RECEIVED: 'message_received',
  GET_ROOM_MESSAGES: 'get_room_messages',
  ROOM_MESSAGES: 'room_messages',
  GET_PRIVATE_MESSAGES: 'get_private_messages',
  PRIVATE_MESSAGES: 'private_messages',
  CHAT_ERROR: 'chat_error',
  
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  PING_SERVER: 'ping_server',
  PONG: 'pong',
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
  },
  ROOMS: {
    LIST: '/api/rooms',
    CREATE: '/api/rooms',
    JOIN: '/api/rooms/join',
    LEAVE: '/api/rooms/leave',
    GET: '/api/rooms',
  },
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE: '/api/users/profile',
  },
};

// Game marks
export const GAME_MARKS = {
  X: 'X',
  O: 'O',
};

// Room status
export const ROOM_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  ENDED: 'ended',
};
