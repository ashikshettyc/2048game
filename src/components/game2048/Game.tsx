"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Board from './Board';

const INITIAL_TILES = 2;

const initializeBoard = (size: number): number[][] => {
  const newBoard = Array(size).fill(0).map(() => Array(size).fill(0));
  for (let i = 0; i < INITIAL_TILES; i++) {
    addRandomTile(newBoard, size);
  }
  return newBoard;
};

const addRandomTile = (board: number[][], size: number): boolean => {
  const emptyCells: { row: number; col: number }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 0) {
        emptyCells.push({ row: r, col: c });
      }
    }
  }

  if (emptyCells.length > 0) {
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }
  return false;
};

const slide = (row: number[], size: number): { newRow: number[]; score: number } => {
  const newRow = row.filter(cell => cell !== 0);
  let score = 0;
  for (let i = 0; i < newRow.length - 1; i++) {
    if (newRow[i] === newRow[i + 1]) {
      newRow[i] *= 2;
      score += newRow[i]; // Add merged tile value to score
      newRow.splice(i + 1, 1);
    }
  }
  while (newRow.length < size) {
    newRow.push(0);
  }
  return { newRow, score };
};

const rotateRight = (board: number[][], size: number): number[][] => {
  const newBoard: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      newBoard[c][size - 1 - r] = board[r][c];
    }
  }
  return newBoard;
};

const move = (board: number[][], direction: 'up' | 'down' | 'left' | 'right', size: number): { newBoard: number[][]; score: number } => {
  let newBoard = board.map(row => [...row]);
  let totalScore = 0;
  let boardChanged = false;

  const applyMove = (currentBoard: number[][]): number[][] => {
    let changed = false;
    const nextBoard = currentBoard.map(row => {
      const originalRow = [...row];
      const { newRow, score: rowScore } = slide(originalRow, size);
      totalScore += rowScore;
      if (JSON.stringify(originalRow) !== JSON.stringify(newRow)) {
        changed = true;
      }
      return newRow;
    });
    boardChanged = changed || boardChanged;
    return nextBoard;
  };

  switch (direction) {
    case 'left':
      newBoard = applyMove(newBoard);
      break;
    case 'right':
      newBoard = newBoard.map(row => {
        const { newRow, score: rowScore } = slide(row.reverse(), size);
        totalScore += rowScore;
        return newRow.reverse();
      });
      boardChanged = JSON.stringify(board) !== JSON.stringify(newBoard);
      break;
    case 'up':
      newBoard = rotateRight(newBoard, size);
      newBoard = rotateRight(newBoard, size);
      newBoard = rotateRight(newBoard, size); // Rotate 3 times to get 'up' as 'left'
      newBoard = applyMove(newBoard);
      newBoard = rotateRight(newBoard, size); // Rotate back
      break;
    case 'down':
      newBoard = rotateRight(newBoard, size); // Rotate 1 time to get 'down' as 'left'
      newBoard = applyMove(newBoard);
      newBoard = rotateRight(newBoard, size);
      newBoard = rotateRight(newBoard, size);
      newBoard = rotateRight(newBoard, size); // Rotate back
      break;
  }

  if (boardChanged) {
    addRandomTile(newBoard, size);
  }

  return { newBoard, score: totalScore };
};

const checkGameOver = (board: number[][], size: number): boolean => {
  // Check for 2048 tile
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 2048) {
        return true; // Player wins
      }
    }
  }

  // Check for empty cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 0) {
        return false; // Still empty cells, not game over
      }
    }
  }

  // Check for possible merges (horizontal and vertical)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const current = board[r][c];
      // Check right
      if (c < size - 1 && current === board[r][c + 1]) {
        return false;
      }
      // Check down
      if (r < size - 1 && current === board[r + 1][c]) {
        return false;
      }
    }
  }

  return true; // No empty cells and no possible merges
};


const Game: React.FC = () => {
  const [boardSize, setBoardSize] = useState(4);
  const [board, setBoard] = useState<number[][]>(() => initializeBoard(boardSize));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [boardHistory, setBoardHistory] = useState<number[][][]>([]);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);

  useEffect(() => {
    setBoard(initializeBoard(boardSize));
    setScore(0);
    setGameOver(false);
    setBoardHistory([]);
    setScoreHistory([]);
  }, [boardSize]);

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver) return;

    const { newBoard, score: moveScore } = move(board, direction, boardSize);
    if (JSON.stringify(newBoard) !== JSON.stringify(board)) {
      setBoardHistory(prev => [...prev, board]);
      setScoreHistory(prev => [...prev, score]);
      setBoard(newBoard);
      setScore(prevScore => prevScore + moveScore);
      if (checkGameOver(newBoard, boardSize)) {
        setGameOver(true);
      }
    }
  }, [board, gameOver, boardSize, score]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        handleMove('up');
        break;
      case 'ArrowDown':
        handleMove('down');
        break;
      case 'ArrowLeft':
        handleMove('left');
        break;
      case 'ArrowRight':
        handleMove('right');
        break;
    }
  }, [handleMove]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const resetGame = useCallback(() => {
    setBoard(initializeBoard(boardSize));
    setScore(0);
    setGameOver(false);
    setBoardHistory([]);
    setScoreHistory([]);
  }, [boardSize]);

  const undoMove = useCallback(() => {
    if (boardHistory.length > 0) {
      const prevBoard = boardHistory[boardHistory.length - 1];
      const prevScore = scoreHistory[scoreHistory.length - 1];
      setBoard(prevBoard);
      setScore(prevScore);
      setBoardHistory(prev => prev.slice(0, prev.length - 1));
      setScoreHistory(prev => prev.slice(0, prev.length - 1));
      setGameOver(false);
    }
  }, [boardHistory, scoreHistory]);

  const handleBoardSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setBoardSize(Number(event.target.value));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-orange-50 text-orange-800">
      <h1 className="text-5xl font-extrabold mb-4 text-orange-900">2048 Game</h1>
      <div className="flex justify-between items-center w-80 mb-4">
        <div className="flex flex-col items-center bg-orange-300 p-3 rounded-md">
          <div className="text-xs text-orange-100 font-bold">SCORE</div>
          <div className="text-2xl font-bold text-white">{score}</div>
        </div>
        <button
          onClick={resetGame}
          className="px-6 py-3 bg-orange-600 text-white rounded-md font-bold hover:bg-orange-700 transition-colors duration-200"
        >
          New Game
        </button>
      </div>
      <div className="mb-6 flex items-center space-x-4">
        <label htmlFor="board-size" className="text-lg font-semibold">Board Size:</label>
        <select
          id="board-size"
          value={boardSize}
          onChange={handleBoardSizeChange}
          className="p-2 rounded-md border border-orange-300 bg-orange-100 text-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value={3}>3x3</option>
          <option value={4}>4x4</option>
          <option value={5}>5x5</option>
          <option value={6}>6x6</option>
        </select>
        <button
          onClick={undoMove}
          disabled={boardHistory.length === 0}
          className="px-6 py-3 bg-orange-600 text-white rounded-md font-bold hover:bg-orange-700 disabled:opacity-50 transition-colors duration-200"
        >
          Undo
        </button>
      </div>
      <Board board={board} boardSize={boardSize} />
      {gameOver && (
        <div className="mt-6 text-3xl font-bold text-red-600 animate-pulse">
          Game Over! {board.some(row => row.includes(2048)) ? 'You Win!' : 'No more moves!'}
        </div>
      )}
    </div>
  );
};

export default Game;
