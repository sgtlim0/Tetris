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

const COLORS = ['#00f0f0', '#f0f000', '#a000f0', '#00f000', '#f00000', '#0000f0', '#f0a000']

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
    const count = clearingRows.length * 8

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: nextId++,
        x: Math.random() * 100,
        y: -4,
        dx: (Math.random() - 0.5) * 80,
        dy: -(Math.random() * 40 + 20),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })
    }

    setParticles(newParticles)

    const timer = setTimeout(() => setParticles([]), 700)
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
            boxShadow: `0 0 6px ${p.color}`,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
