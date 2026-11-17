import { useEffect, useRef } from 'react'
import type { CurtainPalette } from '../../lib/PageNavigationContext'

export type CurtainPhase = 'idle' | 'covering' | 'covered' | 'revealing'

type Props = {
  phase: CurtainPhase
  reducedMotion: boolean
  palette?: CurtainPalette
  onCovered: () => void
  onRevealed: () => void
}

/* -------------------------------------------------------------------------- */
/* Tunables                                                                   */
/* -------------------------------------------------------------------------- */

// Same duration and easing for covering and revealing.
const DURATION = 340

// Fraction of the timeline each block spends fading. A wide span means many
// blocks are mid-fade at once, which reads as a soft ripple instead of a hard
// moving edge (the "hole being eaten" look).
const SPAN = 0.55

// Shape of the wavefront. 2 = circle, higher = rounder rectangle. The front is
// measured in viewport-normalised units, so it reaches every edge and corner at
// nearly the same time on any aspect ratio.
const FRONT_SHAPE = 5

// Timing offsets (fractions of the whole timeline).
const FRONT_NOISE = 0.14 // low-frequency wobble, keeps the front organic
const CELL_JITTER = 0.05 // per-block randomness
const RIPPLE = 0.012 // faint banding so the front feels like it pulses outward

// Blocks shrink slightly while fading, giving a soft pixel "pop".
const MIN_SCALE = 0.88

// Cell size adapts to the viewport so the pattern density feels the same on
// phone, tablet and desktop.
const MIN_CELL = 12
const MAX_CELL = 18
const CELL_DIVISOR = 58

// Neutral fallback for navigation without a project-specific palette.
const PALETTE = ['#050505', '#0B0B0B', '#111111', '#181818', '#1F1F1F']

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type Rgb = [number, number, number]

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const smooth = (t: number) => t * t * (3 - 2 * t)
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

const hash = (n: number) => {
  let x = Math.imul(n ^ (n >>> 15), 0x85ebca6b)
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35)
  x ^= x >>> 16
  return (x >>> 0) / 4294967295
}

const rand2 = (x: number, y: number, seed: number) =>
  hash(((x * 73856093) ^ (y * 19349663) ^ seed) | 0)

function valueNoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const fx = smooth(x - xi)
  const fy = smooth(y - yi)

  const a = rand2(xi, yi, seed)
  const b = rand2(xi + 1, yi, seed)
  const c = rand2(xi, yi + 1, seed)
  const d = rand2(xi + 1, yi + 1, seed)

  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}

const fbm = (x: number, y: number, seed: number) =>
  valueNoise(x, y, seed) * 0.65 + valueNoise(x * 2.1, y * 2.1, seed + 17) * 0.35

const hexToRgb = (hex: string): Rgb => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const paletteAt = (t: number, paletteRgb: Rgb[]): string => {
  const k = clamp01(t) * (paletteRgb.length - 1)
  const i = Math.min(Math.floor(k), paletteRgb.length - 2)
  const f = k - i
  const a = paletteRgb[i]
  const b = paletteRgb[i + 1]
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)}, ${Math.round(
    a[1] + (b[1] - a[1]) * f,
  )}, ${Math.round(a[2] + (b[2] - a[2]) * f)})`
}

/* -------------------------------------------------------------------------- */
/* Grid                                                                       */
/* -------------------------------------------------------------------------- */

type Grid = {
  cell: number
  cols: number
  rows: number
  thresholds: Float32Array // when each block starts, 0..(1 - SPAN)
  colors: string[]
}

function buildGrid(width: number, height: number, seed: number, palette: readonly string[]): Grid {
  const cell = Math.max(
    MIN_CELL,
    Math.min(MAX_CELL, Math.round(Math.sqrt(width * height) / CELL_DIVISOR)),
  )
  const cols = Math.ceil(width / cell)
  const rows = Math.ceil(height / cell)

  const thresholds = new Float32Array(cols * rows)
  const colors: string[] = new Array(cols * rows)
  const paletteRgb = (palette.length >= 2 ? palette : PALETTE).map(hexToRgb)

  const ref = Math.max(width, height)
  const P = FRONT_SHAPE
  const norm = Math.pow(2, 1 / P) // makes d = 1 exactly at the corners

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col

      // Position in -1..1 relative to the viewport centre. Each axis is
      // normalised separately so the front is viewport-shaped, not circular.
      const px = (col + 0.5) * cell
      const py = (row + 0.5) * cell
      const x = (px / width) * 2 - 1
      const y = (py / height) * 2 - 1

      // Rounded-rectangle distance: edges and corners are reached together.
      const d =
        Math.pow(Math.pow(Math.abs(x), P) + Math.pow(Math.abs(y), P), 1 / P) /
        norm

      // Smooth, low-frequency wobble (shared by neighbours, so the edge stays
      // coherent) plus a small per-block jitter and a faint ripple.
      const wobble = fbm((px / ref) * 3, (py / ref) * 3, seed + 7) - 0.5
      const jitter = rand2(col, row, seed) - 0.5
      const ripple = Math.sin(d * Math.PI * 7) * RIPPLE

      const raw = d * 0.92 + wobble * FRONT_NOISE + jitter * CELL_JITTER + ripple
      thresholds[i] = clamp01(raw) * (1 - SPAN)

      // Colour: a gentle diagonal gradient + smooth noise field + tiny
      // per-block variation. The diagonal is kept weak so no corner is
      // dominated by a single shade.
      const diagonal = (px / width + py / height) / 2
      const field = fbm((px / ref) * 4, (py / ref) * 4, seed + 101)
      const tone =
        0.5 +
        (diagonal - 0.5) * 0.4 +
        (field - 0.5) * 1.1 +
        (rand2(col, row, seed + 3) - 0.5) * 0.08

      colors[i] = paletteAt(tone, paletteRgb)
    }
  }

  return { cell, cols, rows, thresholds, colors }
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function CurtainReveal({
  phase,
  reducedMotion,
  palette,
  onCovered,
  onRevealed,
}: Props) {
  const curtainRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // One seed per curtain session, so the pattern stays identical across the
  // covering -> covered -> revealing phases instead of re-rolling each time.
  const seedRef = useRef<number | null>(null)

  const active = phase !== 'idle'

  const onCoveredRef = useRef(onCovered)
  const onRevealedRef = useRef(onRevealed)

  onCoveredRef.current = onCovered
  onRevealedRef.current = onRevealed

  useEffect(() => {
    if (!active) seedRef.current = null
  }, [active])

  // Prevent scrolling while the curtain is active
  useEffect(() => {
    const curtain = curtainRef.current
    if (!active || !curtain) return

    const preventScroll = (event: Event) => event.preventDefault()

    curtain.addEventListener('wheel', preventScroll, { passive: false })
    curtain.addEventListener('touchmove', preventScroll, { passive: false })

    return () => {
      curtain.removeEventListener('wheel', preventScroll)
      curtain.removeEventListener('touchmove', preventScroll)
    }
  }, [active])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!active || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (seedRef.current === null) seedRef.current = (Math.random() * 1e9) | 0
    const seed = seedRef.current

    // 'cover': blocks fade in centre-out. 'reveal': blocks fade out centre-out.
    // `wave` (0..1) is how far the centre-out ripple has travelled.
    const reveal = phase === 'revealing'
    let wave = phase === 'covered' ? 1 : 0

    let raf = 0
    const activePalette = palette ?? PALETTE
    let grid = buildGrid(window.innerWidth, window.innerHeight, seed, activePalette)

    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = window.innerWidth
      const height = window.innerHeight

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      grid = buildGrid(width, height, seed, activePalette)
    }

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      const { cell, cols, rows, thresholds, colors } = grid

      for (let row = 0; row < rows; row++) {
        const y = row * cell

        for (let col = 0; col < cols; col++) {
          const i = row * cols + col

          const local = clamp01((wave - thresholds[i]) / SPAN)
          const e = smooth(local)
          const amount = reveal ? 1 - e : e // 0 = invisible, 1 = solid

          if (amount < 0.004) continue

          ctx.globalAlpha = amount
          ctx.fillStyle = colors[i]

          if (amount >= 0.999) {
            // Slight overlap avoids hairline seams on fractional DPR screens.
            ctx.fillRect(col * cell, y, cell + 0.5, cell + 0.5)
          } else {
            const size = cell * (MIN_SCALE + (1 - MIN_SCALE) * amount)
            const inset = (cell - size) / 2
            ctx.fillRect(col * cell + inset, y + inset, size, size)
          }
        }
      }

      ctx.globalAlpha = 1
    }

    layout()
    draw()

    const onResize = () => {
      layout()
      draw()
    }

    window.addEventListener('resize', onResize)

    const animate = (done: () => void) => {
      const start = performance.now()

      const tick = (now: number) => {
        const t = Math.min((now - start) / DURATION, 1)

        wave = easeInOutSine(t)
        draw()

        if (t < 1) {
          raf = requestAnimationFrame(tick)
        } else {
          done()
        }
      }

      raf = requestAnimationFrame(tick)
    }

    if (phase === 'covering') {
      if (reducedMotion) {
        wave = 1
        draw()
        onCoveredRef.current()
      } else {
        animate(() => onCoveredRef.current())
      }
    } else if (phase === 'revealing') {
      if (reducedMotion) {
        wave = 1
        draw()
        onRevealedRef.current()
      } else {
        animate(() => onRevealedRef.current())
      }
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [active, phase, reducedMotion, palette])

  if (!active) return null

  return (
    <div
      ref={curtainRef}
      aria-hidden="true"
      data-page-curtain={phase}
      className="fixed inset-0 z-[10050] overflow-hidden pointer-events-auto"
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  )
}