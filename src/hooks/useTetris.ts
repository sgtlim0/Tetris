import { useState, useCallback, useEffect, useRef } from 'react'
import { hapticStrong, hapticPattern } from '../utils/sound.ts'
import type { GameState, GamePhase, ActivePiece, TetrominoType } from '../game/types.ts'
import { createEmptyBoard, placePiece, findFullRows, clearRows, getGhostPosition } from '../game/board.ts'
import { createBag, spawnPiece, rotatePiece, movePiece, hardDrop } from '../game/pieces.ts'
import { calculateLineScore, calculateLevel, detectTSpin, isGameOver } from '../game/scoring.ts'
import {
  getLevelSpeed,
  LOCK_DELAY_MS,
  LOCK_DELAY_MAX_RESETS,
  CLEAR_ANIMATION_MS,
  NEXT_QUEUE_SIZE,
  SCORE_SOFT_DROP,
  SCORE_HARD_DROP,
  HIGH_SCORE_KEY,
} from '../game/constants.ts'
import {
  playMove,
  playRotate,
  playSoftDrop,
  playHardDrop,
  playLineClear,
  playTetrisClear,
  playTSpin,
  playLevelUp,
  playHold,
  playCombo,
  playGameOver,
} from '../utils/sound.ts'

function loadHighScore(): number {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY)
    return stored ? parseInt(stored, 10) : 0
  } catch {
    return 0
  }
}

function saveHighScore(score: number): void {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score))
  } catch { /* ignore */ }
}

function createInitialState(): GameState {
  return {
    board: createEmptyBoard(),
    activePiece: null,
    phase: 'start',
    score: 0,
    level: 0,
    lines: 0,
    combo: -1,
    holdPiece: null,
    holdUsed: false,
    nextQueue: [],
    clearingRows: [],
    highScore: loadHighScore(),
    lastClearWasTetris: false,
  }
}

type TetrisActions = {
  startGame: () => void
  moveLeft: () => void
  moveRight: () => void
  softDrop: () => void
  hardDropAction: () => void
  rotateClockwise: () => void
  rotateCounterClockwise: () => void
  holdAction: () => void
  togglePause: () => void
  returnToMenu: () => void
}

export type UseTetrisReturn = GameState & TetrisActions & {
  ghostRow: number | null
  ghostCol: number | null
}

export function useTetris(): UseTetrisReturn {
  const [state, setState] = useState<GameState>(createInitialState)

  // Refs to avoid stale closures (synced via effect per React 19 rules)
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  const bagRef = useRef<TetrominoType[]>([])
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lockResetsRef = useRef(0)
  const gravityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastRotationRef = useRef(false)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // Pull next piece from bag, refilling as needed
  const pullFromBag = useCallback((): TetrominoType => {
    if (bagRef.current.length === 0) {
      bagRef.current = createBag()
    }
    return bagRef.current.shift()!
  }, [])

  // Fill the next queue to the desired size
  const fillQueue = useCallback((currentQueue: readonly TetrominoType[]): TetrominoType[] => {
    const queue = [...currentQueue]
    while (queue.length < NEXT_QUEUE_SIZE + 1) {
      queue.push(pullFromBag())
    }
    return queue
  }, [pullFromBag])

  // Clear timers
  const clearLockTimer = useCallback(() => {
    if (lockTimerRef.current !== null) {
      clearTimeout(lockTimerRef.current)
      lockTimerRef.current = null
    }
  }, [])

  const clearGravityTimer = useCallback(() => {
    if (gravityTimerRef.current !== null) {
      clearInterval(gravityTimerRef.current)
      gravityTimerRef.current = null
    }
  }, [])

  // Lock piece and process clears
  const lockPiece = useCallback(() => {
    clearLockTimer()

    const s = stateRef.current
    if (!s.activePiece || s.phase !== 'playing') return

    const newBoard = placePiece(s.board, s.activePiece)
    const isTSpin = detectTSpin(s.board, s.activePiece, lastRotationRef.current)
    const fullRows = findFullRows(newBoard)

    if (isTSpin) {
      playTSpin()
    }

    if (fullRows.length > 0) {
      // Enter clearing phase
      if (fullRows.length === 4) {
        playTetrisClear()
        hapticPattern([30, 50, 30, 50, 60])
      } else {
        playLineClear(fullRows.length)
        hapticStrong()
      }

      const newCombo = s.combo + 1
      if (newCombo > 0) {
        playCombo(newCombo)
      }

      const lineScore = calculateLineScore(fullRows.length, s.level, isTSpin, newCombo)
      const newLines = s.lines + fullRows.length
      const newLevel = calculateLevel(newLines)
      const oldLevel = s.level

      const newScore = s.score + lineScore
      const newHighScore = Math.max(s.highScore, newScore)

      setState(prev => ({
        ...prev,
        board: newBoard,
        activePiece: null,
        phase: 'clearing' as GamePhase,
        score: newScore,
        lines: newLines,
        level: newLevel,
        combo: newCombo,
        clearingRows: fullRows,
        holdUsed: false,
        highScore: newHighScore,
        lastClearWasTetris: fullRows.length === 4,
      }))

      if (newLevel > oldLevel) {
        setTimeout(() => playLevelUp(), 200)
      }

      // After clear animation, spawn next
      setTimeout(() => {
        const current = stateRef.current
        if (current.phase !== 'clearing') return

        const clearedBoard = clearRows(current.board, current.clearingRows)
        const queue = fillQueue(current.nextQueue)
        const nextType = queue.shift()!
        const next = spawnPiece(nextType)

        if (isGameOver(clearedBoard)) {
          clearGravityTimer()
          saveHighScore(current.highScore)
          playGameOver()
          setState(prev => ({
            ...prev,
            board: clearedBoard,
            activePiece: null,
            phase: 'gameOver',
            clearingRows: [],
            nextQueue: queue,
          }))
          return
        }

        lastRotationRef.current = false
        lockResetsRef.current = 0

        setState(prev => ({
          ...prev,
          board: clearedBoard,
          activePiece: next,
          phase: 'playing',
          clearingRows: [],
          nextQueue: queue,
        }))
      }, CLEAR_ANIMATION_MS)
    } else {
      // No lines cleared - check game over
      if (isGameOver(newBoard)) {
        clearGravityTimer()
        const newHighScore = Math.max(s.highScore, s.score)
        saveHighScore(newHighScore)
        playGameOver()
        setState(prev => ({
          ...prev,
          board: newBoard,
          activePiece: null,
          phase: 'gameOver',
          combo: -1,
          holdUsed: false,
          highScore: newHighScore,
        }))
        return
      }

      // Spawn next piece
      const queue = fillQueue(s.nextQueue)
      const nextType = queue.shift()!
      const next = spawnPiece(nextType)

      lastRotationRef.current = false
      lockResetsRef.current = 0

      setState(prev => ({
        ...prev,
        board: newBoard,
        activePiece: next,
        combo: -1,
        holdUsed: false,
        nextQueue: queue,
      }))
    }
  }, [clearLockTimer, clearGravityTimer, fillQueue])

  // Start lock delay (called when piece lands on something)
  const startLockDelay = useCallback(() => {
    clearLockTimer()
    lockTimerRef.current = setTimeout(() => {
      lockPiece()
    }, LOCK_DELAY_MS)
  }, [clearLockTimer, lockPiece])

  // Reset lock delay on move/rotate (max resets)
  const resetLockDelay = useCallback(() => {
    if (lockTimerRef.current === null) return
    if (lockResetsRef.current >= LOCK_DELAY_MAX_RESETS) return
    lockResetsRef.current++
    clearLockTimer()
    lockTimerRef.current = setTimeout(() => {
      lockPiece()
    }, LOCK_DELAY_MS)
  }, [clearLockTimer, lockPiece])

  // Check if piece is on the ground (can't move down)
  const isOnGround = useCallback((piece: ActivePiece, s: GameState): boolean => {
    const moved = movePiece(piece, s.board, 1, 0)
    return moved === null
  }, [])

  // Gravity tick
  const gravityTick = useCallback(() => {
    const s = stateRef.current
    if (s.phase !== 'playing' || !s.activePiece) return

    const moved = movePiece(s.activePiece, s.board, 1, 0)
    if (moved) {
      lastRotationRef.current = false
      setState(prev => ({ ...prev, activePiece: moved }))
      // Check if now on ground
      if (isOnGround(moved, s)) {
        startLockDelay()
      }
    } else {
      // Already on ground, start lock delay if not already started
      if (lockTimerRef.current === null) {
        startLockDelay()
      }
    }
  }, [isOnGround, startLockDelay])

  // Start/restart gravity interval
  const startGravity = useCallback((level: number) => {
    clearGravityTimer()
    const speed = getLevelSpeed(level)
    gravityTimerRef.current = setInterval(() => {
      gravityTick()
    }, speed)
  }, [clearGravityTimer, gravityTick])

  // === Actions ===

  const startGame = useCallback(() => {
    bagRef.current = []
    lockResetsRef.current = 0
    lastRotationRef.current = false
    clearLockTimer()
    clearGravityTimer()

    const queue = fillQueue([])
    const firstType = queue.shift()!
    const firstPiece = spawnPiece(firstType)

    setState({
      board: createEmptyBoard(),
      activePiece: firstPiece,
      phase: 'playing',
      score: 0,
      level: 0,
      lines: 0,
      combo: -1,
      holdPiece: null,
      holdUsed: false,
      nextQueue: queue,
      clearingRows: [],
      highScore: loadHighScore(),
      lastClearWasTetris: false,
    })

    startGravity(0)
  }, [fillQueue, clearLockTimer, clearGravityTimer, startGravity])

  const moveLeft = useCallback(() => {
    const s = stateRef.current
    if (s.phase !== 'playing' || !s.activePiece) return
    const moved = movePiece(s.activePiece, s.board, 0, -1)
    if (moved) {
      lastRotationRef.current = false
      playMove()
      setState(prev => ({ ...prev, activePiece: moved }))
      if (isOnGround(moved, s)) {
        resetLockDelay()
      } else {
        clearLockTimer()
      }
    }
  }, [isOnGround, resetLockDelay, clearLockTimer])

  const moveRight = useCallback(() => {
    const s = stateRef.current
    if (s.phase !== 'playing' || !s.activePiece) return
    const moved = movePiece(s.activePiece, s.board, 0, 1)
    if (moved) {
      lastRotationRef.current = false
      playMove()
      setState(prev => ({ ...prev, activePiece: moved }))
      if (isOnGround(moved, s)) {
        resetLockDelay()
      } else {
        clearLockTimer()
      }
    }
  }, [isOnGround, resetLockDelay, clearLockTimer])

  const softDrop = useCallback(() => {
    const s = stateRef.current
    if (s.phase !== 'playing' || !s.activePiece) return
    const moved = movePiece(s.activePiece, s.board, 1, 0)
    if (moved) {
      lastRotationRef.current = false
      playSoftDrop()
      setState(prev => ({
        ...prev,
        activePiece: moved,
        score: prev.score + SCORE_SOFT_DROP,
      }))
      if (isOnGround(moved, s)) {
        startLockDelay()
      }
    } else {
      // Already at bottom
      if (lockTimerRef.current === null) {
        startLockDelay()
      }
    }
  }, [isOnGround, startLockDelay])

  const hardDropAction = useCallback(() => {
    const s = stateRef.current
    if (s.phase !== 'playing' || !s.activePiece) return

    const dropped = hardDrop(s.activePiece, s.board)
    const rowsDropped = dropped.row - s.activePiece.row
    playHardDrop()
    hapticStrong()

    clearLockTimer()
    lockResetsRef.current = 0

    // Place immediately
    setState(prev => ({
      ...prev,
      activePiece: dropped,
      score: prev.score + rowsDropped * SCORE_HARD_DROP,
    }))

    // Lock immediately via setTimeout(0) to let state update first
    setTimeout(() => {
      // Update stateRef manually since setState above may not have propagated
      stateRef.current = {
        ...stateRef.current,
        activePiece: dropped,
        score: stateRef.current.score + rowsDropped * SCORE_HARD_DROP,
      }
      lockPiece()
    }, 0)
  }, [clearLockTimer, lockPiece])

  const rotateClockwise = useCallback(() => {
    const s = stateRef.current
    if (s.phase !== 'playing' || !s.activePiece) return
    const rotated = rotatePiece(s.activePiece, s.board, true)
    if (rotated) {
      lastRotationRef.current = true
      playRotate()
      setState(prev => ({ ...prev, activePiece: rotated }))
      if (isOnGround(rotated, s)) {
        resetLockDelay()
      } else {
        clearLockTimer()
      }
    }
  }, [isOnGround, resetLockDelay, clearLockTimer])

  const rotateCounterClockwise = useCallback(() => {
    const s = stateRef.current
    if (s.phase !== 'playing' || !s.activePiece) return
    const rotated = rotatePiece(s.activePiece, s.board, false)
    if (rotated) {
      lastRotationRef.current = true
      playRotate()
      setState(prev => ({ ...prev, activePiece: rotated }))
      if (isOnGround(rotated, s)) {
        resetLockDelay()
      } else {
        clearLockTimer()
      }
    }
  }, [isOnGround, resetLockDelay, clearLockTimer])

  const holdAction = useCallback(() => {
    const s = stateRef.current
    if (s.phase !== 'playing' || !s.activePiece || s.holdUsed) return

    clearLockTimer()
    lockResetsRef.current = 0
    lastRotationRef.current = false
    playHold()

    const currentType = s.activePiece.type

    if (s.holdPiece) {
      // Swap with held piece
      const newPiece = spawnPiece(s.holdPiece)
      setState(prev => ({
        ...prev,
        activePiece: newPiece,
        holdPiece: currentType,
        holdUsed: true,
      }))
    } else {
      // First hold: take from queue
      const queue = fillQueue(s.nextQueue)
      const nextType = queue.shift()!
      const newPiece = spawnPiece(nextType)
      setState(prev => ({
        ...prev,
        activePiece: newPiece,
        holdPiece: currentType,
        holdUsed: true,
        nextQueue: queue,
      }))
    }
  }, [clearLockTimer, fillQueue])

  const togglePause = useCallback(() => {
    const s = stateRef.current
    if (s.phase === 'playing') {
      clearGravityTimer()
      clearLockTimer()
      setState(prev => ({ ...prev, phase: 'paused' }))
    } else if (s.phase === 'paused') {
      setState(prev => ({ ...prev, phase: 'playing' }))
      startGravity(s.level)
    }
  }, [clearGravityTimer, clearLockTimer, startGravity])

  const returnToMenu = useCallback(() => {
    clearGravityTimer()
    clearLockTimer()
    setState(createInitialState())
  }, [clearGravityTimer, clearLockTimer])

  // Screen Wake Lock: keep screen on while playing
  useEffect(() => {
    async function acquireWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        }
      } catch { /* ignore - e.g. not supported or denied */ }
    }

    function releaseWakeLock() {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {})
        wakeLockRef.current = null
      }
    }

    if (state.phase === 'playing') {
      acquireWakeLock()
    } else {
      releaseWakeLock()
    }

    return () => releaseWakeLock()
  }, [state.phase])

  // Restart gravity when level changes
  useEffect(() => {
    if (state.phase === 'playing') {
      startGravity(state.level)
    }
    return () => clearGravityTimer()
  }, [state.level, state.phase, startGravity, clearGravityTimer])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat && !['ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(e.key)) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          moveLeft()
          break
        case 'ArrowRight':
          e.preventDefault()
          moveRight()
          break
        case 'ArrowDown':
          e.preventDefault()
          softDrop()
          break
        case 'ArrowUp':
          e.preventDefault()
          rotateClockwise()
          break
        case 'z':
        case 'Z':
          rotateCounterClockwise()
          break
        case ' ':
          e.preventDefault()
          hardDropAction()
          break
        case 'c':
        case 'C':
          holdAction()
          break
        case 'p':
        case 'P':
        case 'Escape':
          togglePause()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [moveLeft, moveRight, softDrop, hardDropAction, rotateClockwise, rotateCounterClockwise, holdAction, togglePause])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearGravityTimer()
      clearLockTimer()
    }
  }, [clearGravityTimer, clearLockTimer])

  // Ghost piece (derived state)
  let ghostRow: number | null = null
  let ghostCol: number | null = null
  if (state.activePiece && state.phase === 'playing') {
    const ghost = getGhostPosition(state.board, state.activePiece)
    if (ghost.row !== state.activePiece.row) {
      ghostRow = ghost.row
      ghostCol = ghost.col
    }
  }

  return {
    ...state,
    ghostRow,
    ghostCol,
    startGame,
    moveLeft,
    moveRight,
    softDrop,
    hardDropAction,
    rotateClockwise,
    rotateCounterClockwise,
    holdAction,
    togglePause,
    returnToMenu,
  }
}
