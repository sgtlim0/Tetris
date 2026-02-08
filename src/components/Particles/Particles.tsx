import { useState, useEffect, useRef } from 'react'
import styles from './Particles.module.css'

type Particle = {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  color: string
}

type Props = {
  clearingRows: readonly number[]
}

const COLORS = ['#00f0f0', '#f0f000', '#a000f0', '#00f000', '#f00000', '#0060f0', '#f0a000', '#ffffff']

let nextId = 0

export function Particles({ clearingRows }: Props) {
  const [particles, setParticles] = useState<Particle[]>([])
  const prevRowsRef = useRef<readonly number[]>([])

  useEffect(() => {
    if (clearingRows.length === 0 || clearingRows === prevRowsRef.current) {
      prevRowsRef.current = clearingRows
      return
    }
    prevRowsRef.current = clearingRows

    const newParticles: Particle[] = []
    const count = clearingRows.length * 12

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: nextId++,
        x: Math.random() * 100,
        y: -2 - Math.random() * 6,
        dx: (Math.random() - 0.5) * 100,
        dy: -(Math.random() * 50 + 25),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })
    }

    setParticles(newParticles)

    const timer = setTimeout(() => setParticles([]), 900)
    return () => clearTimeout(timer)
  }, [clearingRows])

  if (particles.length === 0) return null

  return (
    <div className={styles.container}>
      {particles.map(p => (
        <div
          key={p.id}
          className={styles.particle}
          style={{
            left: `${p.x}%`,
            top: `${p.y}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 8px ${p.color}`,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
