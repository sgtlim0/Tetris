import { useRef, useCallback, useEffect } from 'react'
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

  // Auto-repeat for on-screen buttons (DAS + ARR)
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
        onRotate()
      }
    } else if (absDy > absDx && dy < -minSwipe) {
      onHold()
    } else if (absDy > absDx && dy > minSwipe * 2) {
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
      <div className={styles.topRow}>
        <button className={styles.btnSmall} onPointerDown={onHold}>Hold</button>
        <button className={styles.btnSmall} onPointerDown={onPause}>| |</button>
      </div>
      <div className={styles.row}>
        <button className={styles.btn} onPointerDown={onRotate}>&#x21BB;</button>
      </div>
      <div className={styles.row}>
        <button
          className={styles.btn}
          onPointerDown={handlePointerDown(onLeft)}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          &#x25C0;
        </button>
        <button
          className={styles.btn}
          onPointerDown={handlePointerDown(onSoftDrop)}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          &#x25BC;
        </button>
        <button
          className={styles.btn}
          onPointerDown={handlePointerDown(onRight)}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          &#x25B6;
        </button>
      </div>
      <div className={styles.row}>
        <button className={styles.btnWide} onPointerDown={onHardDrop}>Hard Drop</button>
      </div>
    </div>
  )
}
