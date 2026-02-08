import styles from './StartScreen.module.css'

type Props = {
  onStart: () => void
  highScore: number
}

export function StartScreen({ onStart, highScore }: Props) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Tetris</h1>
      <p className={styles.subtitle}>Classic block-stacking puzzle</p>
      {highScore > 0 && (
        <p className={styles.highScore}>High Score: {highScore.toLocaleString()}</p>
      )}
      <dl className={styles.rules}>
        <dt>Arrow Keys </dt><dd>Move left/right, soft drop</dd>
        <dt>Up Arrow </dt><dd>Rotate clockwise</dd>
        <dt>Z </dt><dd>Rotate counter-clockwise</dd>
        <dt>Space </dt><dd>Hard drop</dd>
        <dt>C </dt><dd>Hold piece</dd>
        <dt>P / ESC </dt><dd>Pause</dd>
        <dt>Mobile </dt><dd>Swipe L/R, tap=rotate, swipe down=drop, swipe up=hold</dd>
      </dl>
      <button className={styles.playBtn} onClick={onStart}>
        Play
      </button>
    </div>
  )
}
