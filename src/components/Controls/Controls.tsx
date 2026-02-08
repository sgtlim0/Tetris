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

export function Controls({ onLeft, onRight, onRotate, onSoftDrop, onHardDrop, onHold, onPause }: Props) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const swipeHandledRef = useRef(false)

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
      // Tap = rotate
      if (!swipeHandledRef.current) {
        onRotate()
      }
    } else if (absDy > absDx && dy < -minSwipe) {
      // Swipe up = hold
      onHold()
    } else if (absDy > absDx && dy > minSwipe) {
      // Swipe down = hard drop
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

    // Horizontal swipe for movement (each 40px = one cell move)
    if (absDx > 30 && absDx > absDy) {
      swipeHandledRef.current = true
      if (dx > 0) {
        onRight()
      } else {
        onLeft()
      }
      // Reset start point for continuous movement
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
        <button className={styles.btn} onPointerDown={onLeft}>&#x25C0;</button>
        <button className={styles.btn} onPointerDown={onSoftDrop}>&#x25BC;</button>
        <button className={styles.btn} onPointerDown={onRight}>&#x25B6;</button>
      </div>
      <div className={styles.row}>
        <button className={styles.btnWide} onPointerDown={onHardDrop}>Drop</button>
      </div>
    </div>
  )
}
