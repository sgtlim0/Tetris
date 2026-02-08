import styles from './GameOver.module.css'

type Props = {
  score: number
  highScore: number
  level: number
  lines: number
  onRetry: () => void
  onMenu: () => void
}

export function GameOver({ score, highScore, level, lines, onRetry, onMenu }: Props) {
  const isNewHighScore = score >= highScore && score > 0

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Game Over</h1>
      {isNewHighScore && (
        <div className={styles.newHighScore}>New High Score!</div>
      )}
      <div className={styles.stats}>
        <span className={styles.statLabel}>Score</span>
        <span className={styles.statValue}>{score.toLocaleString()}</span>
        <span className={styles.statLabel}>High Score</span>
        <span className={styles.statValue}>{highScore.toLocaleString()}</span>
        <span className={styles.statLabel}>Level</span>
        <span className={styles.statValue}>{level}</span>
        <span className={styles.statLabel}>Lines</span>
        <span className={styles.statValue}>{lines}</span>
      </div>
      <div className={styles.buttons}>
        <button className={styles.retryBtn} onClick={onRetry}>
          Retry
        </button>
        <button className={styles.menuBtn} onClick={onMenu}>
          Menu
        </button>
      </div>
    </div>
  )
}
