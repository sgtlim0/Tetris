export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

export type GamePhase = 'start' | 'playing' | 'paused' | 'clearing' | 'gameOver'

export type Cell = TetrominoType | null

export type Board = Cell[][]

export type RotationState = 0 | 1 | 2 | 3

export type ActivePiece = {
  readonly type: TetrominoType
  readonly row: number
  readonly col: number
  readonly rotation: RotationState
}

export type GhostPiece = {
  readonly row: number
  readonly col: number
}

export type GameState = {
  readonly board: Board
  readonly activePiece: ActivePiece | null
  readonly phase: GamePhase
  readonly score: number
  readonly level: number
  readonly lines: number
  readonly combo: number
  readonly holdPiece: TetrominoType | null
  readonly holdUsed: boolean
  readonly nextQueue: readonly TetrominoType[]
  readonly clearingRows: readonly number[]
  readonly highScore: number
  readonly lastClearWasTetris: boolean
}

export type WallKickTable = readonly (readonly [number, number])[]

export type WallKickData = Record<string, WallKickTable>

export type PieceShape = readonly (readonly number[])[]
