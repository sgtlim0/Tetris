import type { TetrominoType, RotationState, ActivePiece, Board } from './types.ts'
import {
  PIECE_SHAPES,
  WALL_KICKS_JLSTZ,
  WALL_KICKS_I,
  BOARD_COLS,
  BUFFER_ROWS,
} from './constants.ts'
import { hasCollision } from './board.ts'

const ALL_TYPES: readonly TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

// 7-bag randomizer
export function createBag(): TetrominoType[] {
  const bag = [...ALL_TYPES]
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]]
  }
  return bag
}

export function getShape(type: TetrominoType, rotation: RotationState): readonly (readonly number[])[] {
  return PIECE_SHAPES[type][rotation]
}

export function spawnPiece(type: TetrominoType): ActivePiece {
  const shape = getShape(type, 0)
  const cols = shape[0].length
  const spawnCol = Math.floor((BOARD_COLS - cols) / 2)
  // Spawn in buffer zone, just above the visible board
  // Find the first row in the shape that has blocks
  let firstFilledRow = 0
  for (let r = 0; r < shape.length; r++) {
    if (shape[r].some(c => c === 1)) {
      firstFilledRow = r
      break
    }
  }
  const spawnRow = BUFFER_ROWS - 1 - firstFilledRow

  return {
    type,
    row: spawnRow,
    col: spawnCol,
    rotation: 0,
  }
}

export function rotatePiece(
  piece: ActivePiece,
  board: Board,
  clockwise: boolean,
): ActivePiece | null {
  const fromRot = piece.rotation
  const toRot: RotationState = clockwise
    ? ((fromRot + 1) % 4) as RotationState
    : ((fromRot + 3) % 4) as RotationState

  const kickKey = `${fromRot}>${toRot}`
  const kickTable = piece.type === 'I' ? WALL_KICKS_I : WALL_KICKS_JLSTZ
  const kicks = kickTable[kickKey]

  if (!kicks) return null

  for (const [dx, dy] of kicks) {
    // SRS convention: +y is up, our grid +row is down → flip dy
    const newPiece: ActivePiece = {
      ...piece,
      rotation: toRot,
      col: piece.col + dx,
      row: piece.row - dy,
    }
    if (!hasCollision(board, newPiece)) {
      return newPiece
    }
  }

  return null
}

export function movePiece(
  piece: ActivePiece,
  board: Board,
  dRow: number,
  dCol: number,
): ActivePiece | null {
  const newPiece: ActivePiece = {
    ...piece,
    row: piece.row + dRow,
    col: piece.col + dCol,
  }
  if (!hasCollision(board, newPiece)) {
    return newPiece
  }
  return null
}

export function hardDrop(piece: ActivePiece, board: Board): ActivePiece {
  let current = piece
  for (;;) {
    const next = movePiece(current, board, 1, 0)
    if (!next) return current
    current = next
  }
}
