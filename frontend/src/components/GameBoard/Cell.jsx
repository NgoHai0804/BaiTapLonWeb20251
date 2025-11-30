import React from 'react';

const Cell = ({ value, x, y, isHovered, onClick, onMouseEnter, onMouseLeave, disabled, isLastMove = false }) => {
  const getCellContent = () => {
    if (value === 'X') {
      return (
        <span 
          className="text-blue-600 font-bold leading-none block"
          style={{ 
            fontSize: '85%', 
            lineHeight: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          ✕
        </span>
      );
    }
    if (value === 'O') {
      return (
        <span 
          className="text-red-600 font-bold leading-none block"
          style={{ 
            fontSize: '85%', 
            lineHeight: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          ○
        </span>
      );
    }
    return null;
  };

  return (
    <button
      className={`
        w-full h-full border border-gray-300 bg-white
        flex items-center justify-center
        transition-all duration-200
        p-0
        ${isHovered && !value ? 'bg-gray-100 border-gray-400' : ''}
        ${isLastMove ? 'ring-4 ring-yellow-400 ring-opacity-75 bg-yellow-50' : ''}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'}
        ${value ? 'cursor-default' : ''}
      `}
      onClick={() => !disabled && !value && onClick(x, y)}
      onMouseEnter={() => !disabled && !value && onMouseEnter(x, y)}
      onMouseLeave={onMouseLeave}
      disabled={disabled || !!value}
      style={{ minHeight: 0, minWidth: 0 }}
    >
      {getCellContent()}
    </button>
  );
};

export default Cell;
