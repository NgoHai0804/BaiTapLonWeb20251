import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import GameBoard from '../../components/GameBoard/GameBoard';
import { BOARD_SIZE } from '../../utils/constants';
import { checkWinner as checkWinnerUtil } from '../../utils/checkWinner';
import { playSound } from '../../utils/soundManager';

const DIFFICULTIES = {
  easy: { name: 'Dễ', depth: 1 },
  medium: { name: 'Trung bình', depth: 2 },
  hard: { name: 'Khó', depth: 3 },
};

const PlayVsBot = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [board, setBoard] = useState(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
  const [currentTurn, setCurrentTurn] = useState('X');
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Hàm kiểm tra người thắng
  const checkWinnerLocal = (board, x, y) => {
    return checkWinnerUtil(board, x, y);
  };

  // Bot thực hiện nước đi - gọi API hoặc tính toán local
  const makeBotMove = useCallback(async () => {
    if (isGameOver || currentTurn !== 'O') return;

    setIsBotThinking(true);
    
    // Mô phỏng thời gian bot suy nghĩ
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Gọi API để lấy nước đi của bot
      const response = await fetch('http://localhost:3000/api/bot/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')?.replace(/^"(.*)"$/, '$1')}`,
        },
        body: JSON.stringify({
          board,
          botMark: 'O',
          difficulty,
          lastMove: history[history.length - 1],
        }),
      });

      const data = await response.json();
      if (data.success && data.move) {
        handleMove(data.move.x, data.move.y, 'O');
      } else {
        // Dự phòng: nước đi ngẫu nhiên
        const emptyCells = [];
        for (let x = 0; x < BOARD_SIZE; x++) {
          for (let y = 0; y < BOARD_SIZE; y++) {
            if (board[x][y] === null) {
              emptyCells.push({ x, y });
            }
          }
        }
        if (emptyCells.length > 0) {
          const randomMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
          handleMove(randomMove.x, randomMove.y, 'O');
        }
      }
    } catch (error) {
      console.error('Lỗi khi bot thực hiện nước đi:', error);
      // Dự phòng: nước đi ngẫu nhiên
      const emptyCells = [];
      for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
          if (board[x][y] === null) {
            emptyCells.push({ x, y });
          }
        }
      }
      if (emptyCells.length > 0) {
        const randomMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        handleMove(randomMove.x, randomMove.y, 'O');
      }
    } finally {
      setIsBotThinking(false);
    }
  }, [board, currentTurn, isGameOver, difficulty, history]);

  // Xử lý nước đi của người chơi
  const handleMove = (x, y, mark) => {
    if (isGameOver || board[x][y] !== null) return;

    const newBoard = board.map(row => [...row]);
    newBoard[x][y] = mark;

    // Cập nhật lịch sử nước đi
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ x, y, mark, moveNumber: newHistory.length + 1 });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setBoard(newBoard);

    // Kiểm tra người thắng
    if (checkWinnerLocal(newBoard, x, y)) {
      setIsGameOver(true);
      setWinner(mark);
      if (mark === 'X') {
        toast.success('Bạn thắng!');
        playSound('win');
      } else {
        toast.error('Bot thắng!');
        playSound('lose');
      }
      return;
    }

    // Kiểm tra hòa (bàn cờ đầy)
    const isFull = newBoard.every(row => row.every(cell => cell !== null));
    if (isFull) {
      setIsGameOver(true);
      setIsDraw(true);
      toast.info('Hòa!');
      playSound('draw');
      return;
    }

    // Chuyển lượt
    setCurrentTurn(mark === 'X' ? 'O' : 'X');
  };

  // Xử lý khi click vào ô cờ
  const handleCellClick = (x, y) => {
    if (currentTurn !== 'X' || isGameOver || isBotThinking) return;
    playSound('move');
    handleMove(x, y, 'X');
  };

  // Bot tự động chơi sau khi người chơi đi
  useEffect(() => {
    if (currentTurn === 'O' && !isGameOver && !isBotThinking) {
      makeBotMove();
    }
  }, [currentTurn, isGameOver, makeBotMove, isBotThinking]);

  // Hoàn tác nước đi
  const handleUndo = () => {
    if (historyIndex < 0 || isGameOver) return;
    
    const newHistory = history.slice(0, historyIndex);
    const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    
    newHistory.forEach(move => {
      newBoard[move.x][move.y] = move.mark;
    });

    setBoard(newBoard);
    setHistoryIndex(historyIndex - 1);
    setIsGameOver(false);
    setWinner(null);
    setIsDraw(false);
    setCurrentTurn(newHistory.length % 2 === 0 ? 'X' : 'O');
  };

  // Làm lại nước đi
  const handleRedo = () => {
    if (historyIndex >= history.length - 1 || isGameOver) return;

    const nextIndex = historyIndex + 1;
    const move = history[nextIndex];
    const newBoard = board.map(row => [...row]);
    newBoard[move.x][move.y] = move.mark;

    setBoard(newBoard);
    setHistoryIndex(nextIndex);
    setCurrentTurn(move.mark === 'X' ? 'O' : 'X');
  };

  // Khởi động lại game
  const handleReset = () => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
    setCurrentTurn('X');
    setIsGameOver(false);
    setWinner(null);
    setIsDraw(false);
    setHistory([]);
    setHistoryIndex(-1);
  };

  // Bắt đầu game mới với độ khó được chọn
  const handleStartGame = (newDifficulty) => {
    setDifficulty(newDifficulty);
    handleReset();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Chơi với Bot</h1>
              <p className="text-gray-600 text-sm">
                Độ khó: {DIFFICULTIES[difficulty].name}
              </p>
            </div>
            <button
              onClick={() => navigate('/lobby')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>

        {!isGameOver && history.length === 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-lg font-semibold mb-4">Chọn độ khó:</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleStartGame('easy')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Dễ
              </button>
              <button
                onClick={() => handleStartGame('medium')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Trung bình
              </button>
              <button
                onClick={() => handleStartGame('hard')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Khó
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <GameBoard 
              onCellClick={handleCellClick} 
              disabled={currentTurn !== 'X' || isGameOver || isBotThinking}
            />
            
            {isBotThinking && (
              <div className="mt-4 bg-white rounded-lg shadow p-4 text-center">
                <p className="text-gray-600">Bot đang suy nghĩ...</p>
              </div>
            )}

            {isGameOver && (
              <div className="mt-4 bg-white rounded-lg shadow p-4 text-center">
                {winner ? (
                  <p className="text-2xl font-bold text-green-600">
                    {winner === 'X' ? 'Bạn thắng!' : 'Bot thắng!'}
                  </p>
                ) : (
                  <p className="text-2xl font-bold text-gray-600">Hòa!</p>
                )}
              </div>
            )}

            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex < 0 || isGameOver}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hoàn tác
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1 || isGameOver}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Làm lại
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Chơi lại
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-2">Lịch sử nước đi</h3>
              <div className="max-h-96 overflow-y-auto space-y-1">
                {history.length === 0 ? (
                  <p className="text-gray-500 text-sm">Chưa có nước đi nào</p>
                ) : (
                  history.map((move, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-sm ${
                        index === historyIndex ? 'bg-blue-100' : 'bg-gray-50'
                      }`}
                    >
                      <span className="font-semibold">#{move.moveNumber}</span> - {move.mark} tại ({move.x}, {move.y})
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayVsBot;
