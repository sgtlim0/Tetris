import styles from './ScorePanel.module.css'

type Props = {
  score: number
  level: number
  lines: number
  combo: number
}

export function ScorePanel({ score, level, lines, combo }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.item}>
        <span className={styles.label}>Score</span>
        <span className={styles.value}>{score.toLocaleString()}</span>
      </div>
      <div className={styles.item}>
        <span className={styles.label}>Level</span>
        <span className={styles.value}>{level}</span>
      </div>
      <div className={styles.item}>
        <span className={styles.label}>Lines</span>
        <span className={styles.value}>{lines}</span>
      </div>
      {combo > 0 && (
        <div className={styles.combo} key={combo}>
          {combo}x Combo!
        </div>
      )}
    </div>
  )
}
