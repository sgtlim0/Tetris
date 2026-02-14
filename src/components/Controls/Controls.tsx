import { useRef, useCallback, useEffect } from 'react'
import { haptic, hapticStrong } from '../../utils/sound.ts'
import styles from './Controls.module.css'

type Props = {
  onLeft: () => void
  onRight: () => void
  onRotate: () => void
  onSoftDrop: () => void
  onHardDrop: () => void
  onHold: () => void
  onPause: () => void
}

const DAS_DELAY = 170
const ARR_RATE = 50

function withHaptic(action: () => void, ms?: number): () => void {
  return () => {
    haptic(ms)
    action()
  }
}

export function Controls({ onLeft, onRight, onRotate, onSoftDrop, onHardDrop, onHold, onPause }: Props) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const swipeHandledRef = useRef(false)
  const repeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const repeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearRepeat = useCallback(() => {
    if (repeatTimerRef.current !== null) {
      clearTimeout(repeatTimerRef.current)
      repeatTimerRef.current = null
    }
    if (repeatIntervalRef.current !== null) {
      clearInterval(repeatIntervalRef.current)
      repeatIntervalRef.current = null
    }
  }, [])

  const startRepeat = useCallback((action: () => void) => {
    clearRepeat()
    action()
    repeatTimerRef.current = setTimeout(() => {
      repeatIntervalRef.current = setInterval(action, ARR_RATE)
    }, DAS_DELAY)
  }, [clearRepeat])

  const handlePointerDown = useCallback((action: () => void) => {
    return () => startRepeat(action)
  }, [startRepeat])

  const handlePointerUp = useCallback(() => {
    clearRepeat()
  }, [clearRepeat])

  // Touch gesture handling
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
    swipeHandledRef.current = false
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return
    if ((e.target as HTMLElement).closest('button')) return

    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStartRef.current.x
    const dy = touch.clientY - touchStartRef.current.y
    const elapsed = Date.now() - touchStartRef.current.time

    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    const minSwipe = 30

    if (absDx < minSwipe && absDy < minSwipe && elapsed < 300) {
      if (!swipeHandledRef.current) {
        haptic()
        onRotate()
      }
    } else if (absDy > absDx && dy < -minSwipe) {
      haptic()
      onHold()
    } else if (absDy > absDx && dy > minSwipe * 2) {
      hapticStrong()
      onHardDrop()
    }

    touchStartRef.current = null
  }, [onRotate, onHold, onHardDrop])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return
    if ((e.target as HTMLElement).closest('button')) return

    const touch = e.touches[0]
    const dx = touch.clientX - touchStartRef.current.x
    const absDx = Math.abs(dx)
    const absDy = Math.abs(touch.clientY - touchStartRef.current.y)

    if (absDx > 25 && absDx > absDy) {
      swipeHandledRef.current = true
      haptic(5)
      if (dx > 0) {
        onRight()
      } else {
        onLeft()
      }
      touchStartRef.current = {
        ...touchStartRef.current,
        x: touch.clientX,
      }
    }
  }, [onLeft, onRight])

  useEffect(() => {
    const opts: AddEventListenerOptions = { passive: true }
    document.addEventListener('touchstart', handleTouchStart, opts)
    document.addEventListener('touchend', handleTouchEnd, opts)
    document.addEventListener('touchmove', handleTouchMove, opts)
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchmove', handleTouchMove)
    }
  }, [handleTouchStart, handleTouchEnd, handleTouchMove])

  useEffect(() => {
    return () => clearRepeat()
  }, [clearRepeat])

  return (
    <div className={styles.controls}>
      {/* Top utility row */}
      <div className={styles.utilRow}>
        <button className={styles.btnUtil} onPointerDown={withHaptic(onHold)}>Hold</button>
        <button className={styles.btnUtil} onPointerDown={withHaptic(onPause)}>| |</button>
      </div>

      {/* Gamepad layout: D-pad left, Actions right */}
      <div className={styles.gamepad}>
        {/* Left: D-pad */}
        <div className={styles.dpad}>
          <div className={styles.dpadRow}>
            <button
              className={styles.btn}
              onPointerDown={handlePointerDown(withHaptic(onLeft, 5))}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              &#x25C0;
            </button>
            <button
              className={styles.btn}
              onPointerDown={handlePointerDown(withHaptic(onSoftDrop, 5))}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              &#x25BC;
            </button>
            <button
              className={styles.btn}
              onPointerDown={handlePointerDown(withHaptic(onRight, 5))}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              &#x25B6;
            </button>
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className={styles.actions}>
          <button className={styles.btnAction} onPointerDown={withHaptic(onRotate)}>
            &#x21BB;
          </button>
          <button className={styles.btnDrop} onPointerDown={withHaptic(onHardDrop, 20)}>
            &#x25BD;
          </button>
        </div>
      </div>
    </div>
  )
}
