import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseComputerMove, findOutcome } from './gameLogic.js';

test('detects a horizontal win and returns its cells', () => {
  assert.deepEqual(findOutcome(['X', 'X', 'X', 'O', '', 'O', '', '', '']), {
    winner: 'X', winningCells: [0, 1, 2],
  });
});

test('detects a vertical win', () => {
  assert.deepEqual(findOutcome(['O', 'X', '', 'O', 'X', '', 'O', '', '']), {
    winner: 'O', winningCells: [0, 3, 6],
  });
});

test('detects a diagonal win', () => {
  assert.deepEqual(findOutcome(['X', 'O', '', '', 'X', 'O', '', '', 'X']), {
    winner: 'X', winningCells: [0, 4, 8],
  });
});

test('detects a full-board draw', () => {
  assert.deepEqual(findOutcome(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']), {
    winner: null, winningCells: [], draw: true,
  });
});

test('leaves an unfinished game active', () => {
  assert.equal(findOutcome(['X', 'O', '', '', 'X', '', '', '', 'O']), null);
});

test('computer takes a winning move when available', () => {
  assert.equal(chooseComputerMove(['O', 'O', '', 'X', 'X', '', '', '', '']), 2);
});

test('computer blocks an immediate human win', () => {
  assert.equal(chooseComputerMove(['X', 'X', '', '', '', 'O', '', '', '']), 2);
});

test('computer has no move on a finished board', () => {
  assert.equal(chooseComputerMove(['X', 'X', 'X', 'O', 'O', '', '', '', '']), null);
});

test('easy computer misses an immediate block so X can win', () => {
  const board = ['X', '', '', 'X', 'O', '', '', '', ''];
  const move = chooseComputerMove(board, 'O', 'easy');
  assert.equal(move, 1);
  board[move] = 'O';
  board[6] = 'X';
  assert.equal(findOutcome(board)?.winner, 'X');
});