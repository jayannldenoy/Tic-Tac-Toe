const winningCombos = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function findOutcome(board) {
  for (const combo of winningCombos) {
    const [first, second, third] = combo;
    if (board[first] && board[first] === board[second] && board[first] === board[third]) {
      return { winner: board[first], winningCells: combo };
    }
  }
  if (board.every(Boolean)) return { winner: null, winningCells: [], draw: true };
  return null;
}

function minimax(board, computerMark, currentMark, depth) {
  const outcome = findOutcome(board);
  if (outcome?.winner === computerMark) return 10 - depth;
  if (outcome?.winner) return depth - 10;
  if (outcome?.draw) return 0;

  const maximizing = currentMark === computerMark;
  let bestScore = maximizing ? -Infinity : Infinity;
  const nextMark = currentMark === 'X' ? 'O' : 'X';

  for (let index = 0; index < board.length; index += 1) {
    if (board[index]) continue;
    board[index] = currentMark;
    const score = minimax(board, computerMark, nextMark, depth + 1);
    board[index] = '';
    bestScore = maximizing ? Math.max(bestScore, score) : Math.min(bestScore, score);
  }
  return bestScore;
}

export function chooseComputerMove(board, computerMark = 'O', difficulty = 'hard') {
  if (findOutcome(board)) return null;
  if (difficulty === 'easy') return board.findIndex((cell) => !cell);
  let bestMove = null;
  let bestScore = -Infinity;
  const humanMark = computerMark === 'X' ? 'O' : 'X';

  for (let index = 0; index < board.length; index += 1) {
    if (board[index]) continue;
    board[index] = computerMark;
    const score = minimax(board, computerMark, humanMark, 1);
    board[index] = '';
    if (score > bestScore) {
      bestScore = score;
      bestMove = index;
    }
  }
  return bestMove;
}