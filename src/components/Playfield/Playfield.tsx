import { useMemo } from 'react'
import type { Board, ActivePiece, Cell } from '../../game/types.ts'
import { BUFFER_ROWS, BOARD_ROWS, BOARD_COLS, PIECE_COLORS } from '../../game/constants.ts'
import { getShape } from '../../game/pieces.ts'
import styles from './Playfield.module.css'

type Props = {
  board: Board
  activePiece: ActivePiece | null
  ghostRow: number | null
  ghostCol: number | null
  clearingRows: readonly number[]
}

type CellRender = {
  color: string | null
  isActive: boolean
  isGhost: boolean
  isClearing: boolean
}

export function Playfield({ board, activePiece, ghostRow, ghostCol, clearingRows }: Props) {
  const clearingSet = useMemo(() => new Set(clearingRows), [clearingRows])

  const grid = useMemo(() => {
    const cells: CellRender[][] = []

    // Build the visible grid (skip buffer rows)
    for (let r = BUFFER_ROWS; r < BUFFER_ROWS + BOARD_ROWS; r++) {
      const row: CellRender[] = []
      for (let c = 0; c < BOARD_COLS; c++) {
        const boardCell: Cell = board[r][c]
        row.push({
          color: boardCell ? PIECE_COLORS[boardCell] : null,
          isActive: false,
          isGhost: false,
          isClearing: clearingSet.has(r),
        })
      }
      cells.push(row)
    }

    // Overlay ghost piece
    if (activePiece && ghostRow !== null && ghostCol !== null) {
      const shape = getShape(activePiece.type, activePiece.rotation)
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] === 0) continue
          const visRow = ghostRow + r - BUFFER_ROWS
          const visCol = ghostCol + c
          if (visRow >= 0 && visRow < BOARD_ROWS && visCol >= 0 && visCol < BOARD_COLS) {
            if (!cells[visRow][visCol].color) {
              cells[visRow][visCol] = {
                ...cells[visRow][visCol],
                color: PIECE_COLORS[activePiece.type],
                isGhost: true,
              }
            }
          }
        }
      }
    }

    // Overlay active piece
    if (activePiece) {
      const shape = getShape(activePiece.type, activePiece.rotation)
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] === 0) continue
          const visRow = activePiece.row + r - BUFFER_ROWS
          const visCol = activePiece.col + c
          if (visRow >= 0 && visRow < BOARD_ROWS && visCol >= 0 && visCol < BOARD_COLS) {
            cells[visRow][visCol] = {
              color: PIECE_COLORS[activePiece.type],
              isActive: true,
              isGhost: false,
              isClearing: false,
            }
          }
        }
      }
    }

    return cells
  }, [board, activePiece, ghostRow, ghostCol, clearingSet])

  return (
    <div className={styles.playfield}>
      {grid.map((row, r) =>
        row.map((cell, c) => {
          let className = styles.cell
          if (cell.isClearing) {
            className += ' ' + styles.clearing
          } else if (cell.isActive) {
            className += ' ' + styles.active
          } else if (cell.isGhost) {
            className += ' ' + styles.ghost
          } else if (cell.color) {
            className += ' ' + styles.filled
          } else {
            className += ' ' + styles.empty
          }

          return (
            <div
              key={`${r}-${c}`}
              className={className}
              style={cell.color ? { backgroundColor: cell.color } : undefined}
            />
          )
        })
      )}
    </div>
  )
}
