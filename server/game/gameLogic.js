/**
 * Pure, stateless game logic shared by every mode (5x5 classic, 10x10 super,
 * and any future boardSize/maxNumber/requiredLines combination).
 */

/** Fisher-Yates shuffle. Returns a new array, does not mutate input. */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generates a boardSize x boardSize board containing every number from
 * 1..maxNumber exactly once, randomly positioned.
 * boardSize * boardSize must equal maxNumber.
 */
function generateBoard(boardSize, maxNumber) {
  const numbers = Array.from({ length: maxNumber }, (_, i) => i + 1);
  const shuffled = shuffle(numbers);
  const board = [];
  for (let r = 0; r < boardSize; r++) {
    board.push(shuffled.slice(r * boardSize, r * boardSize + boardSize));
  }
  return board;
}

/**
 * Builds a boolean "marked grid" for a given board + set of marked numbers.
 */
function buildMarkedGrid(board, markedNumbers) {
  const markedSet = markedNumbers instanceof Set ? markedNumbers : new Set(markedNumbers);
  return board.map((row) => row.map((num) => markedSet.has(num)));
}

/**
 * Calculates every completed line (rows, columns, 2 diagonals) for a board.
 * Returns { total, lines: [{type, index}], rows, columns, diagonals }
 */
function calculateCompletedLines(board, markedNumbers) {
  const size = board.length;
  const grid = buildMarkedGrid(board, markedNumbers);
  const lines = [];

  // Rows
  for (let r = 0; r < size; r++) {
    if (grid[r].every(Boolean)) lines.push({ type: "row", index: r });
  }

  // Columns
  for (let c = 0; c < size; c++) {
    let complete = true;
    for (let r = 0; r < size; r++) {
      if (!grid[r][c]) {
        complete = false;
        break;
      }
    }
    if (complete) lines.push({ type: "column", index: c });
  }

  // Main diagonal (top-left -> bottom-right)
  let mainDiagComplete = true;
  for (let i = 0; i < size; i++) {
    if (!grid[i][i]) {
      mainDiagComplete = false;
      break;
    }
  }
  if (mainDiagComplete) lines.push({ type: "diagonal", index: 0 });

  // Anti diagonal (top-right -> bottom-left)
  let antiDiagComplete = true;
  for (let i = 0; i < size; i++) {
    if (!grid[i][size - 1 - i]) {
      antiDiagComplete = false;
      break;
    }
  }
  if (antiDiagComplete) lines.push({ type: "diagonal", index: 1 });

  const rows = lines.filter((l) => l.type === "row").length;
  const columns = lines.filter((l) => l.type === "column").length;
  const diagonals = lines.filter((l) => l.type === "diagonal").length;

  return { total: lines.length, lines, rows, columns, diagonals };
}

/** Finds [row, col] of a number on a board. Returns null if not found. */
function findPosition(board, number) {
  for (let r = 0; r < board.length; r++) {
    const c = board[r].indexOf(number);
    if (c !== -1) return [r, c];
  }
  return null;
}

module.exports = {
  shuffle,
  generateBoard,
  buildMarkedGrid,
  calculateCompletedLines,
  findPosition,
};
