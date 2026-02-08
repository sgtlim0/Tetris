import type { TetrominoType } from '../../game/types.ts'
import { PIECE_SHAPES, PIECE_COLORS } from '../../game/constants.ts'
import styles from './PiecePreview.module.css'

type Props = {
  type: TetrominoType | null
  label: string
  dimmed?: boolean
  small?: boolean
}

export function PiecePreview({ type, label, dimmed, small }: Props) {
  const shape = type ? PIECE_SHAPES[type][0] : null
  const color = type ? PIECE_COLORS[type] : null
  const size = shape ? shape[0].length : 3

  const gridClass = size === 4 ? styles.grid4 : size === 2 ? styles.grid2 : styles.grid3
  const containerClass = `${styles.container}${small ? ' ' + styles.small : ''}${dimmed ? ' ' + styles.dimmed : ''}`

  return (
    <div className={containerClass}>
      {label && <div className={styles.label}>{label}</div>}
      <div className={`${styles.grid} ${gridClass}`}>
        {shape
          ? shape.flatMap((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`${styles.cell} ${cell ? styles.filled : styles.empty}`}
                  style={cell ? { backgroundColor: color! } : undefined}
                />
              ))
            )
          : Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className={`${styles.cell} ${styles.empty}`} />
            ))}
      </div>
    </div>
  )
}
