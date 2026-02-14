import styles from './ScorePanel.module.css'

type Props = {
  score: number
  level: number
  lines: number
  combo: number
  compact?: boolean
}

export function ScorePanel({ score, level, lines, combo, compact }: Props) {
  if (compact) {
    return (
      <div className={styles.compactPanel}>
        <div className={styles.compactItem}>
          <span className={styles.compactLabel}>SCR</span>
          <span className={styles.compactValue}>{score.toLocaleString()}</span>
        </div>
        <div className={styles.compactItem}>
          <span className={styles.compactLabel}>LV</span>
          <span className={styles.compactValue}>{level}</span>
        </div>
        <div className={styles.compactItem}>
          <span className={styles.compactLabel}>LN</span>
          <span className={styles.compactValue}>{lines}</span>
        </div>
        {combo > 0 && (
          <span className={styles.compactCombo} key={combo}>
            {combo}x
          </span>
        )}
      </div>
    )
  }

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
