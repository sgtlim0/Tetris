import type { ActivePiece, Board } from './types.ts'
import {
  SCORE_SINGLE,
  SCORE_DOUBLE,
  SCORE_TRIPLE,
  SCORE_TETRIS,
  SCORE_TSPIN_SINGLE,
  SCORE_TSPIN_DOUBLE,
  SCORE_TSPIN_TRIPLE,
  COMBO_MULTIPLIER,
  LINES_PER_LEVEL,
} from './constants.ts'
import { BUFFER_ROWS, TOTAL_ROWS, BOARD_COLS } from './constants.ts'

export function detectTSpin(board: Board, piece: ActivePiece, wasRotation: boolean): boolean {
  if (piece.type !== 'T') return false
  if (!wasRotation) return false

  // T-spin: 3 of 4 corners occupied around the T center
  // Center of T piece depends on rotation, but it's always at offset (1,1) in the 3x3 grid
  const centerRow = piece.row + 1
  const centerCol = piece.col + 1

  const corners = [
    [centerRow - 1, centerCol - 1],
    [centerRow - 1, centerCol + 1],
    [centerRow + 1, centerCol - 1],
    [centerRow + 1, centerCol + 1],
  ]

  let occupied = 0
  for (const [r, c] of corners) {
    if (r < 0 || r >= TOTAL_ROWS || c < 0 || c >= BOARD_COLS) {
      occupied++
    } else if (board[r][c] !== null) {
      occupied++
    }
  }

  return occupied >= 3
}

export function calculateLineScore(
  linesCleared: number,
  level: number,
  isTSpin: boolean,
  combo: number,
): number {
  let base = 0

  if (isTSpin) {
    switch (linesCleared) {
      case 1: base = SCORE_TSPIN_SINGLE; break
      case 2: base = SCORE_TSPIN_DOUBLE; break
      case 3: base = SCORE_TSPIN_TRIPLE; break
      default: base = SCORE_TSPIN_TRIPLE; break
    }
  } else {
    switch (linesCleared) {
      case 1: base = SCORE_SINGLE; break
      case 2: base = SCORE_DOUBLE; break
      case 3: base = SCORE_TRIPLE; break
      case 4: base = SCORE_TETRIS; break
      default: base = SCORE_TETRIS; break
    }
  }

  const levelMultiplied = base * (level + 1)
  const comboBonus = combo > 0 ? COMBO_MULTIPLIER * combo * (level + 1) : 0

  return levelMultiplied + comboBonus
}

export function calculateLevel(totalLines: number): number {
  return Math.floor(totalLines / LINES_PER_LEVEL)
}

export function isGameOver(board: Board): boolean {
  // Game over if any cell in the visible top row (first row of visible area) is occupied
  // Actually, check if anything is in the buffer zone
  for (let r = 0; r < BUFFER_ROWS; r++) {
    if (board[r].some(cell => cell !== null)) {
      return true
    }
  }
  return false
}
