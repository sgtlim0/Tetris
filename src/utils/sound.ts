let ctx: AudioContext | null = null

/** Trigger short haptic vibration if supported */
export function haptic(ms: number = 10): void {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(ms)
    }
  } catch { /* ignore */ }
}

/** Stronger haptic for impactful actions (hard drop, line clear) */
export function hapticStrong(): void {
  haptic(25)
}

/** Pattern haptic for special events */
export function hapticPattern(pattern: number[]): void {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  } catch { /* ignore */ }
}

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playNote(
  c: AudioContext,
  freq: number,
  startTime: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  dest: AudioNode,
): void {
  const o = c.createOscillator()
  const g = c.createGain()
  o.connect(g)
  g.connect(dest)
  o.type = type
  o.frequency.setValueAtTime(freq, startTime)
  g.gain.setValueAtTime(0.001, startTime)
  g.gain.linearRampToValueAtTime(vol, startTime + 0.01)
  g.gain.exponentialRampToValueAtTime(0.001, startTime + dur)
  o.start(startTime)
  o.stop(startTime + dur)
}

function createNoise(c: AudioContext, duration: number, vol: number): GainNode {
  const bufSize = c.sampleRate * duration
  const buf = c.createBuffer(1, bufSize, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5
  }
  const src = c.createBufferSource()
  src.buffer = buf
  const g = c.createGain()
  g.gain.setValueAtTime(vol, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
  src.connect(g)
  src.start(c.currentTime)
  src.stop(c.currentTime + duration)
  return g
}

/** Short click when piece moves left/right */
export function playMove(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    playNote(c, 300, now, 0.04, 'sine', 0.06, c.destination)
    const noise = createNoise(c, 0.02, 0.03)
    const hp = c.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 4000
    noise.connect(hp)
    hp.connect(c.destination)
  } catch { /* ignore */ }
}

/** Chirp when piece rotates */
export function playRotate(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    const o = c.createOscillator()
    const g = c.createGain()
    o.connect(g)
    g.connect(c.destination)
    o.type = 'sine'
    o.frequency.setValueAtTime(600, now)
    o.frequency.exponentialRampToValueAtTime(900, now + 0.06)
    g.gain.setValueAtTime(0.08, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    o.start(now)
    o.stop(now + 0.08)
    playNote(c, 1200, now + 0.01, 0.04, 'sine', 0.04, c.destination)
  } catch { /* ignore */ }
}

/** Tick for each soft drop row */
export function playSoftDrop(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    playNote(c, 200, now, 0.03, 'sine', 0.04, c.destination)
  } catch { /* ignore */ }
}

/** Thud on hard drop impact */
export function playHardDrop(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    // Low thud
    const o = c.createOscillator()
    const g = c.createGain()
    o.connect(g)
    g.connect(c.destination)
    o.type = 'sine'
    o.frequency.setValueAtTime(100, now)
    o.frequency.exponentialRampToValueAtTime(40, now + 0.15)
    g.gain.setValueAtTime(0.2, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
    o.start(now)
    o.stop(now + 0.18)
    // Impact noise
    const noise = createNoise(c, 0.08, 0.1)
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 800
    noise.connect(lp)
    lp.connect(c.destination)
  } catch { /* ignore */ }
}

/** Chime for 1-3 line clear (escalates) */
export function playLineClear(lines: number): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    const baseFreqs = [523, 659, 784]
    const count = Math.min(lines, 3)
    for (let i = 0; i < count; i++) {
      const t = now + i * 0.06
      playNote(c, baseFreqs[i], t, 0.2, 'sine', 0.12, c.destination)
      playNote(c, baseFreqs[i] * 2, t + 0.02, 0.1, 'sine', 0.05, c.destination)
    }
    const noise = createNoise(c, 0.1, 0.04)
    const hp = c.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 5000
    noise.connect(hp)
    hp.connect(c.destination)
  } catch { /* ignore */ }
}

/** Fanfare for 4-line Tetris clear */
export function playTetrisClear(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    // Triumphant ascending arpeggio
    const notes: readonly [number, number, number][] = [
      [523, 0, 0.2],
      [659, 0.1, 0.2],
      [784, 0.2, 0.2],
      [1047, 0.3, 0.35],
    ]
    for (const [freq, offset, dur] of notes) {
      const t = now + offset
      playNote(c, freq, t, dur, 'sine', 0.14, c.destination)
      playNote(c, freq * 1.5, t + 0.02, dur * 0.7, 'triangle', 0.06, c.destination)
    }
    // Sparkle
    const noise = createNoise(c, 0.25, 0.05)
    const hp = c.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 6000
    noise.connect(hp)
    hp.connect(c.destination)
  } catch { /* ignore */ }
}

/** Sparkle effect for T-spin */
export function playTSpin(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    const sparkleNotes = [880, 1175, 1568, 1760]
    sparkleNotes.forEach((freq, i) => {
      const t = now + i * 0.04
      playNote(c, freq, t, 0.15, 'sine', 0.08, c.destination)
      playNote(c, freq * 2, t + 0.015, 0.08, 'sine', 0.03, c.destination)
    })
    const noise = createNoise(c, 0.12, 0.04)
    const hp = c.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 7000
    noise.connect(hp)
    hp.connect(c.destination)
  } catch { /* ignore */ }
}

/** Fanfare on level up */
export function playLevelUp(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    const melody: readonly [number, number, number][] = [
      [523, 0, 0.15],
      [659, 0.1, 0.15],
      [784, 0.2, 0.15],
      [1047, 0.3, 0.3],
    ]
    for (const [freq, offset, dur] of melody) {
      const t = now + offset
      playNote(c, freq, t, dur, 'sine', 0.12, c.destination)
      playNote(c, freq * 0.5, t, dur, 'sine', 0.05, c.destination)
    }
  } catch { /* ignore */ }
}

/** Swap sound for hold piece */
export function playHold(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    const o = c.createOscillator()
    const g = c.createGain()
    o.connect(g)
    g.connect(c.destination)
    o.type = 'sine'
    o.frequency.setValueAtTime(500, now)
    o.frequency.exponentialRampToValueAtTime(800, now + 0.08)
    g.gain.setValueAtTime(0.1, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    o.start(now)
    o.stop(now + 0.1)
    playNote(c, 700, now + 0.03, 0.06, 'triangle', 0.06, c.destination)
  } catch { /* ignore */ }
}

/** Rising tone for combo continuation */
export function playCombo(level: number): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    const base = 600 + level * 120
    playNote(c, base, now, 0.12, 'sine', 0.1, c.destination)
    playNote(c, base * 1.25, now + 0.04, 0.1, 'triangle', 0.06, c.destination)
    playNote(c, base * 1.5, now + 0.08, 0.08, 'sine', 0.04, c.destination)
  } catch { /* ignore */ }
}

/** Descending sad tone on game over */
export function playGameOver(): void {
  try {
    const c = getCtx()
    const now = c.currentTime
    const notes: readonly [number, number, number][] = [
      [523, 0, 0.3],
      [466, 0.25, 0.3],
      [415, 0.5, 0.3],
      [392, 0.75, 0.5],
    ]
    for (const [freq, offset, dur] of notes) {
      playNote(c, freq, now + offset, dur, 'sine', 0.1, c.destination)
      playNote(c, freq * 0.5, now + offset, dur, 'triangle', 0.05, c.destination)
    }
  } catch { /* ignore */ }
}
