import type { Board, Cell, ActivePiece, GhostPiece } from './types.ts'
import { BOARD_COLS, TOTAL_ROWS, BUFFER_ROWS } from './constants.ts'
import { getShape } from './pieces.ts'

export function createEmptyBoard(): Board {
  return Array.from({ length: TOTAL_ROWS }, () =>
    Array.from<Cell>({ length: BOARD_COLS }).fill(null)
  )
}

export function hasCollision(board: Board, piece: ActivePiece): boolean {
  const shape = getShape(piece.type, piece.rotation)
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 0) continue
      const boardRow = piece.row + r
      const boardCol = piece.col + c
      if (boardCol < 0 || boardCol >= BOARD_COLS) return true
      if (boardRow >= TOTAL_ROWS) return true
      if (boardRow < 0) continue // above the board is ok
      if (board[boardRow][boardCol] !== null) return true
    }
  }
  return false
}

export function placePiece(board: Board, piece: ActivePiece): Board {
  const newBoard = board.map(row => [...row])
  const shape = getShape(piece.type, piece.rotation)
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 0) continue
      const boardRow = piece.row + r
      const boardCol = piece.col + c
      if (boardRow >= 0 && boardRow < TOTAL_ROWS && boardCol >= 0 && boardCol < BOARD_COLS) {
        newBoard[boardRow][boardCol] = piece.type
      }
    }
  }
  return newBoard
}

export function findFullRows(board: Board): number[] {
  const fullRows: number[] = []
  for (let r = BUFFER_ROWS; r < TOTAL_ROWS; r++) {
    if (board[r].every(cell => cell !== null)) {
      fullRows.push(r)
    }
  }
  return fullRows
}

export function clearRows(board: Board, rows: readonly number[]): Board {
  if (rows.length === 0) return board
  const newBoard = board.map(row => [...row])
  // Remove full rows
  const sortedRows = [...rows].sort((a, b) => a - b)
  for (const row of sortedRows) {
    newBoard.splice(row, 1)
    newBoard.unshift(Array.from<Cell>({ length: BOARD_COLS }).fill(null))
  }
  return newBoard
}

export function getGhostPosition(board: Board, piece: ActivePiece): GhostPiece {
  let ghostRow = piece.row
  for (;;) {
    const testPiece: ActivePiece = { ...piece, row: ghostRow + 1 }
    if (hasCollision(board, testPiece)) break
    ghostRow++
  }
  return { row: ghostRow, col: piece.col }
}

export function isAboveBoard(piece: ActivePiece): boolean {
  const shape = getShape(piece.type, piece.rotation)
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 1 && piece.row + r >= BUFFER_ROWS) {
        return false
      }
    }
  }
  return true
}
