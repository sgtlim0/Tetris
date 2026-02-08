import type { TetrominoType, PieceShape, WallKickData } from './types.ts'

export const BOARD_ROWS = 20
export const BOARD_COLS = 10
export const VISIBLE_ROWS = 20
export const BUFFER_ROWS = 4
export const TOTAL_ROWS = BOARD_ROWS + BUFFER_ROWS

export const NEXT_QUEUE_SIZE = 3

export const LOCK_DELAY_MS = 500
export const LOCK_DELAY_MAX_RESETS = 15
export const CLEAR_ANIMATION_MS = 400

export const LINES_PER_LEVEL = 10

// Gravity: frames per row at 60fps equivalent (converted to ms intervals)
// Level 0 = 1000ms, level 1 = 800ms, ... level 9+ = 50ms
const LEVEL_SPEEDS_MS: readonly number[] = [
  1000, 800, 650, 500, 400, 300, 200, 150, 100, 80,
  70, 60, 55, 50, 50, 50, 45, 45, 40, 40,
]

export function getLevelSpeed(level: number): number {
  if (level >= LEVEL_SPEEDS_MS.length) return 35
  return LEVEL_SPEEDS_MS[level]
}

// Scoring
export const SCORE_SINGLE = 100
export const SCORE_DOUBLE = 300
export const SCORE_TRIPLE = 500
export const SCORE_TETRIS = 800
export const SCORE_TSPIN_SINGLE = 800
export const SCORE_TSPIN_DOUBLE = 1200
export const SCORE_TSPIN_TRIPLE = 1600
export const SCORE_SOFT_DROP = 1
export const SCORE_HARD_DROP = 2

export const COMBO_MULTIPLIER = 50

// Piece colors
export const PIECE_COLORS: Record<TetrominoType, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
}

export const PIECE_GLOW_COLORS: Record<TetrominoType, string> = {
  I: 'rgba(0, 240, 240, 0.4)',
  O: 'rgba(240, 240, 0, 0.4)',
  T: 'rgba(160, 0, 240, 0.4)',
  S: 'rgba(0, 240, 0, 0.4)',
  Z: 'rgba(240, 0, 0, 0.4)',
  J: 'rgba(0, 0, 240, 0.4)',
  L: 'rgba(240, 160, 0, 0.4)',
}

// Tetromino shapes — each rotation state is a 4x4 grid (I) or 3x3 grid
// Stored as [rotation][row][col] where 1 = filled
export const PIECE_SHAPES: Record<TetrominoType, readonly PieceShape[]> = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  ],
  O: [
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
  ],
  T: [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]],
  ],
  S: [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]],
    [[0,0,0],[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,0],[0,1,0]],
  ],
  Z: [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,0],[0,1,1]],
    [[0,1,0],[1,1,0],[1,0,0]],
  ],
  J: [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]],
  ],
  L: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]],
  ],
}

// SRS Wall Kick Data
// Key format: "fromRotation>toRotation"
// Values: [dx, dy] offsets to try (in SRS convention, +y = up, but we flip y later)
export const WALL_KICKS_JLSTZ: WallKickData = {
  '0>1': [[ 0, 0],[-1, 0],[-1, 1],[ 0,-2],[-1,-2]],
  '1>0': [[ 0, 0],[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]],
  '1>2': [[ 0, 0],[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]],
  '2>1': [[ 0, 0],[-1, 0],[-1, 1],[ 0,-2],[-1,-2]],
  '2>3': [[ 0, 0],[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]],
  '3>2': [[ 0, 0],[-1, 0],[-1,-1],[ 0, 2],[-1, 2]],
  '3>0': [[ 0, 0],[-1, 0],[-1,-1],[ 0, 2],[-1, 2]],
  '0>3': [[ 0, 0],[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]],
}

export const WALL_KICKS_I: WallKickData = {
  '0>1': [[ 0, 0],[-2, 0],[ 1, 0],[-2,-1],[ 1, 2]],
  '1>0': [[ 0, 0],[ 2, 0],[-1, 0],[ 2, 1],[-1,-2]],
  '1>2': [[ 0, 0],[-1, 0],[ 2, 0],[-1, 2],[ 2,-1]],
  '2>1': [[ 0, 0],[ 1, 0],[-2, 0],[ 1,-2],[-2, 1]],
  '2>3': [[ 0, 0],[ 2, 0],[-1, 0],[ 2, 1],[-1,-2]],
  '3>2': [[ 0, 0],[-2, 0],[ 1, 0],[-2,-1],[ 1, 2]],
  '3>0': [[ 0, 0],[ 1, 0],[-2, 0],[ 1,-2],[-2, 1]],
  '0>3': [[ 0, 0],[-1, 0],[ 2, 0],[-1, 2],[ 2,-1]],
}

export const HIGH_SCORE_KEY = 'tetris_high_score'
