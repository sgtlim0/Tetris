import { useState, useCallback } from 'react'
import { useTetris } from './hooks/useTetris.ts'
import { Playfield } from './components/Playfield/Playfield.tsx'
import { PiecePreview } from './components/PiecePreview/PiecePreview.tsx'
import { ScorePanel } from './components/ScorePanel/ScorePanel.tsx'
import { Controls } from './components/Controls/Controls.tsx'
import { StartScreen } from './components/StartScreen/StartScreen.tsx'
import { GameOver } from './components/GameOver/GameOver.tsx'
import { Particles } from './components/Particles/Particles.tsx'
import styles from './App.module.css'

function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen().catch(() => {})
  }
}

export default function App() {
  const game = useTetris()
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleFullscreen = useCallback(() => {
    toggleFullscreen()
    setIsFullscreen(prev => !prev)
  }, [])

  if (game.phase === 'start') {
    return <StartScreen onStart={game.startGame} highScore={game.highScore} />
  }

  if (game.phase === 'gameOver') {
    return (
      <GameOver
        score={game.score}
        highScore={game.highScore}
        level={game.level}
        lines={game.lines}
        onRetry={game.startGame}
        onMenu={game.returnToMenu}
      />
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div className={styles.title}>Tetris</div>
        <button className={styles.fullscreenBtn} onClick={handleFullscreen}>
          {isFullscreen ? '⊡' : '⛶'}
        </button>
      </div>

      {/* Mobile compact info bar */}
      <div className={styles.mobileInfoBar}>
        <PiecePreview type={game.holdPiece} label="Hold" dimmed={game.holdUsed} small />
        <ScorePanel
          score={game.score}
          level={game.level}
          lines={game.lines}
          combo={game.combo}
          compact
        />
        <PiecePreview type={game.nextQueue[0] ?? null} label="Next" small />
      </div>

      <div className={styles.gameLayout}>
        {/* Desktop left panel */}
        <div className={styles.leftPanel}>
          <PiecePreview type={game.holdPiece} label="Hold" dimmed={game.holdUsed} />
          <ScorePanel
            score={game.score}
            level={game.level}
            lines={game.lines}
            combo={game.combo}
          />
        </div>
        <div className={styles.centerPanel}>
          <Playfield
            board={game.board}
            activePiece={game.activePiece}
            ghostRow={game.ghostRow}
            ghostCol={game.ghostCol}
            clearingRows={game.clearingRows}
          />
          <Particles clearingRows={game.clearingRows} />
        </div>
        {/* Desktop right panel */}
        <div className={styles.rightPanel}>
          <PiecePreview type={game.nextQueue[0] ?? null} label="Next" />
          {game.nextQueue.slice(1, 3).map((type, i) => (
            <PiecePreview key={i} type={type} label="" small />
          ))}
        </div>
      </div>

      {/* Mobile next queue (below playfield, horizontal) */}
      <div className={styles.mobileNextQueue}>
        {game.nextQueue.slice(1, 4).map((type, i) => (
          <PiecePreview key={i} type={type} label="" small />
        ))}
      </div>

      <Controls
        onLeft={game.moveLeft}
        onRight={game.moveRight}
        onRotate={game.rotateClockwise}
        onSoftDrop={game.softDrop}
        onHardDrop={game.hardDropAction}
        onHold={game.holdAction}
        onPause={game.togglePause}
      />
      {game.phase === 'paused' && (
        <div className={styles.pauseOverlay}>
          <div className={styles.pauseText}>PAUSED</div>
          <div className={styles.pauseHint}>Press P or ESC to resume</div>
          <button className={styles.pauseResume} onClick={game.togglePause}>
            Resume
          </button>
        </div>
      )}
    </div>
  )
}
