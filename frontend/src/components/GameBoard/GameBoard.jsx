import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Cell from './Cell';
import useGameBoard from './useGameBoard';
import { BOARD_SIZE } from '../../utils/constants';

// Component hiển thị bàn cờ Caro
const GameBoard = ({ onCellClick, disabled = false }) => {
  // Lấy trạng thái game từ Redux store
  const { board, currentTurn, isGameOver, lastMove } = useSelector((state) => state.game);
  // Hook xử lý tương tác với bàn cờ (hover, click)
  const { hoveredCell, handleCellHover, handleCellLeave, handleCellClick } = useGameBoard(onCellClick);

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-50 p-4 rounded-lg shadow-lg">
      {/* Lưới bàn cờ */}
      <div className="grid gap-1 bg-gray-200 p-2 rounded" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}>
        {board.map((row, x) =>
          row.map((cell, y) => {
            // Kiểm tra xem ô này có phải là nước đi cuối cùng không
            const isLastMoveCell = lastMove && lastMove.x === x && lastMove.y === y;
            return (
              <div key={`${x}-${y}`} className="aspect-square">
                <Cell
                  value={cell}
                  x={x}
                  y={y}
                  isHovered={hoveredCell?.x === x && hoveredCell?.y === y}
                  isLastMove={isLastMoveCell}
                  onClick={handleCellClick}
                  onMouseEnter={handleCellHover}
                  onMouseLeave={handleCellLeave}
                  disabled={disabled || isGameOver}
                />
              </div>
            );
          })
        )}
      </div>
      
      {/* Hiển thị lượt chơi hiện tại */}
      {!isGameOver && (
        <div className="mt-4 text-center text-gray-600">
          <p>Lượt chơi: <span className="font-bold">{currentTurn}</span></p>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
