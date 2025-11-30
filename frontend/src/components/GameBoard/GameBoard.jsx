import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Cell from './Cell';
import useGameBoard from './useGameBoard';
import { BOARD_SIZE } from '../../utils/constants';

const GameBoard = ({ onCellClick, disabled = false }) => {
  const { board, currentTurn, isGameOver, lastMove } = useSelector((state) => state.game);
  const { hoveredCell, handleCellHover, handleCellLeave, handleCellClick } = useGameBoard(onCellClick);

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-50 p-4 rounded-lg shadow-lg">
      <div className="grid gap-1 bg-gray-200 p-2 rounded" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}>
        {board.map((row, x) =>
          row.map((cell, y) => {
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
      
      {!isGameOver && (
        <div className="mt-4 text-center text-gray-600">
          <p>Lượt chơi: <span className="font-bold">{currentTurn}</span></p>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
