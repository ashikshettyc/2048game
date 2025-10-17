import React from 'react';

interface BoardProps {
  board: number[][];
  boardSize: number;
}

const Board: React.FC<BoardProps> = ({ board, boardSize }) => {
  return (
    <div
      className={`grid gap-2 p-2 bg-gray-300 rounded-lg`}
      style={{
        gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
        width: `${boardSize * 4 + (boardSize - 1) * 0.5}rem`, // 4rem for tile, 0.5rem for gap
      }}
    >
      {board.map((row, rowIndex) => (
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`w-16 h-16 flex items-center justify-center rounded-md text-2xl font-bold ${
              cell === 0 ? 'bg-gray-200' : `bg-tile-${cell}`
            }`}
          >
            {cell !== 0 ? cell : ''}
          </div>
        ))
      ))}
    </div>
  );
};

export default Board;
