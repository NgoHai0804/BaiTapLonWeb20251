/**
 * Socket Integration Guide for Game Result Saving
 * 
 * Hướng dẫn tích hợp lưu kết quả game tự động qua Socket.IO
 */

const gameHistoryService = require('../services/gameHistory.service');
const logger = require('../utils/logger');

/**
 * Thêm vào file: backend/src/sockets/game.socket.js
 * hoặc file socket handler tương tự
 */

function handleGameResult(io, socket) {
    /**
     * Event: 'game:result'
     * Được emit khi game kết thúc
     * 
     * @param {Object} data - Dữ liệu kết quả game
     * @param {String} data.roomId - ID của room
     * @param {Array} data.players - Danh sách players
     * @param {Array} data.moves - Lịch sử các nước đi
     * @param {String} data.winner - 'X', 'O', hoặc 'draw'
     * @param {String} data.winnerUserId - ID người thắng (nếu có)
     * @param {Number} data.duration - Thời gian chơi (seconds)
     */
    socket.on('game:result', async (data) => {
        try {
            logger.info(`Game result received for room: ${data.roomId}`);

            // Validate data
            if (!data.roomId || !data.players || !data.moves) {
                socket.emit('game:result:error', {
                    message: 'Invalid game data'
                });
                return;
            }

            // Lưu vào database
            const savedGame = await gameHistoryService.saveGameHistory({
                roomId: data.roomId,
                players: data.players,
                moves: data.moves,
                winner: data.winner,
                winnerUserId: data.winnerUserId,
                boardSize: data.boardSize || 15,
                gameMode: data.gameMode || 'online',
                duration: data.duration || 0
            });

            logger.info(`Game history saved: ${savedGame._id}`);

            // Emit success to all players in room
            io.to(data.roomId).emit('game:result:saved', {
                gameId: savedGame._id,
                message: 'Game result saved successfully'
            });

            // Optionally: Update leaderboard, send notifications, etc.

        } catch (error) {
            logger.error(`Error saving game result: ${error.message}`);
            socket.emit('game:result:error', {
                message: 'Failed to save game result'
            });
        }
    });
}

module.exports = { handleGameResult };

/**
 * ============================================
 * FRONTEND INTEGRATION
 * ============================================
 * 
 * File: frontend/src/services/socket/gameSocket.js
 */

/*
import { socket } from './socket';

export const emitGameResult = (gameData) => {
  socket.emit('game:result', gameData);
};

export const onGameResultSaved = (callback) => {
  socket.on('game:result:saved', callback);
};

export const onGameResultError = (callback) => {
  socket.on('game:result:error', callback);
};

// Usage in Game Component:
// -----------------------

import { emitGameResult, onGameResultSaved } from '../../services/socket/gameSocket';

function GameComponent() {
  useEffect(() => {
    // Listen for save confirmation
    onGameResultSaved((data) => {
      console.log('Game saved:', data.gameId);
      toast.success('Kết quả đã được lưu!');
      
      // Navigate to replay or history page
      // navigate(`/replay/${data.gameId}`);
    });

    onGameResultError((error) => {
      console.error('Save error:', error.message);
      toast.error('Không thể lưu kết quả game');
    });
  }, []);

  const handleGameEnd = (winner) => {
    const gameData = {
      roomId: currentRoom._id,
      players: [
        {
          userId: player1._id,
          username: player1.username,
          symbol: 'X',
          isWinner: winner === 'X'
        },
        {
          userId: player2._id,
          username: player2.username,
          symbol: 'O',
          isWinner: winner === 'O'
        }
      ],
      moves: gameMovesHistory, // Array of { player, position: {row, col}, timestamp }
      winner: winner, // 'X', 'O', or 'draw'
      winnerUserId: winner === 'X' ? player1._id : winner === 'O' ? player2._id : null,
      boardSize: 15,
      gameMode: 'online',
      duration: Math.floor((Date.now() - gameStartTime) / 1000) // seconds
    };

    emitGameResult(gameData);
  };

  return (
    // ... your game component JSX
  );
}
*/

/**
 * ============================================
 * EXAMPLE GAME DATA STRUCTURE
 * ============================================
 */

const exampleGameData = {
    roomId: "60d5ec49f1b2c72e8c8b4567",
    players: [
        {
            userId: "60d5ec49f1b2c72e8c8b4568",
            username: "player1",
            symbol: "X",
            isWinner: true
        },
        {
            userId: "60d5ec49f1b2c72e8c8b4569",
            username: "player2",
            symbol: "O",
            isWinner: false
        }
    ],
    moves: [
        {
            player: "X",
            position: { row: 7, col: 7 },
            timestamp: "2024-01-15T10:30:00.000Z"
        },
        {
            player: "O",
            position: { row: 7, col: 8 },
            timestamp: "2024-01-15T10:30:05.000Z"
        },
        {
            player: "X",
            position: { row: 8, col: 7 },
            timestamp: "2024-01-15T10:30:10.000Z"
        },
        // ... more moves until game ends
    ],
    winner: "X",
    winnerUserId: "60d5ec49f1b2c72e8c8b4568",
    boardSize: 15,
    gameMode: "online", // 'online', '1P', '2P'
    duration: 300 // 5 minutes in seconds
};

/**
 * ============================================
 * CHECKLIST FOR INTEGRATION
 * ============================================
 * 
 * Backend:
 * [ ] Import handleGameResult vào socket handler chính
 * [ ] Register event listener trong connection handler
 * [ ] Test emit từ client và verify database save
 * 
 * Frontend:
 * [ ] Track game moves trong state/redux
 * [ ] Record game start time
 * [ ] Emit game:result khi game kết thúc
 * [ ] Handle success/error callbacks
 * [ ] Redirect to replay page sau khi save
 * 
 * Testing:
 * [ ] Test với 1 player win scenario
 * [ ] Test với draw scenario
 * [ ] Test với disconnect before game end
 * [ ] Test với invalid data
 * [ ] Verify stats update correctly
 */

/**
 * ============================================
 * ADVANCED: Auto-replay Generation
 * ============================================
 */

/*
// Tạo component Replay để xem lại game

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getGameDetail } from '../../services/api/userApi';

function ReplayPage() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadGame();
  }, [gameId]);

  const loadGame = async () => {
    const response = await getGameDetail(gameId);
    setGame(response.data);
  };

  const playMove = () => {
    if (currentMoveIndex < game.moves.length - 1) {
      setCurrentMoveIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(playMove, 1000); // 1s per move
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentMoveIndex]);

  const renderBoard = () => {
    const board = Array(game.boardSize).fill(null).map(() => 
      Array(game.boardSize).fill(null)
    );

    // Apply moves up to current index
    game.moves.slice(0, currentMoveIndex + 1).forEach(move => {
      board[move.position.row][move.position.col] = move.player;
    });

    return board;
  };

  return (
    <div className="replay-container">
      <h1>Replay Game</h1>
      <div className="replay-controls">
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button onClick={() => setCurrentMoveIndex(0)}>Reset</button>
        <span>Move: {currentMoveIndex + 1} / {game?.moves.length}</span>
      </div>
      <Board board={renderBoard()} />
    </div>
  );
}
*/
