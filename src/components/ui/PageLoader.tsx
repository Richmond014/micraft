import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useAssetPreload } from '../../hooks/useAssetPreload'
import { scrollToTarget } from '../../lib/scroll'

type Phase = 'loading' | 'popping' | 'message' | 'opening' | 'done'
type FillOrder = 'random' | 'rows' | 'center' | 'diagonal'

type PageLoaderProps = {
  /** Optional extra assets to preload (the clover itself is drawn in code). */
  urls?: readonly string[]
  imageAspectRatio?: number
  children: ReactNode
  brand?: string
  /** Logo image revealed after the clover snaps. */
  logo?: string
  logoAlt?: string
  cols?: number
  rows?: number
  fillOrder?: FillOrder
  maxDuration?: number
  background?: string
  foreground?: string
  /** Color of the counter and progress bar. */
  accent?: string
  scrollToTopOnOpen?: boolean
  onComplete?: () => void
}

const NO_URLS: readonly string[] = []
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const CURTAIN_EASE = 'cubic-bezier(0.76, 0, 0.24, 1)'
const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif'
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const RAMP = ' .:-=+*#%@'
const GLITCH = '01{}<>/\\*+'

// Timeline after the counter reaches 100%
const SWIRL_AT = 0.9 // the swirl starts when loading is this far along, so nobody waits at 100%
const SUCK_MS = 1000 // clover is pushed from the stem into the center
const POP_MS = SUCK_MS + 100 // ...and snaps; the logo is already opening by now
const FINAL_HOLD = 600 // the logo rests this long before everything lifts away
const LOGO_IN_MS = 1000 // the logo eases in over this long
const LOGO_IN_DELAY = 640 // measured from the swirl start, so it opens as the tiles collapse
const LOGO_EASE = 'cubic-bezier(0.37, 0, 0.2, 1)' // gentle in, soft landing
const OPEN_MS = 1100 // curtain lifts, logo shrinks away, page un-blurs
const EXIT_STAGGER = 140 // the logo starts leaving first, the curtain follows
const SWEEP_MS = 340 // how long the push takes to travel from the stem across the clover
const TRAVEL_MS = SUCK_MS - SWEEP_MS - 60 // how long each tile spends spiraling in
const WIND_UP_DEG = -5 // each tile pulls back a touch before it is pushed

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(a: number, b: number, c: number) {
  const x = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453
  return x - Math.floor(x)
}

function buildRanks(cols: number, rows: number, order: FillOrder): number[] {
  const n = cols * rows
  const idx = Array.from({ length: n }, (_, i) => i)
  const cx = (cols - 1) / 2
  const cy = (rows - 1) / 2
  const colOf = (i: number) => i % cols
  const rowOf = (i: number) => Math.floor(i / cols)

  let sorted: number[]
  if (order === 'rows') {
    sorted = idx
  } else if (order === 'diagonal') {
    sorted = [...idx].sort((a, b) => colOf(a) + rowOf(a) - (colOf(b) + rowOf(b)) || a - b)
  } else if (order === 'center') {
    const distance = (i: number) => Math.hypot(colOf(i) - cx, rowOf(i) - cy)
    sorted = [...idx].sort((a, b) => distance(a) - distance(b) || a - b)
  } else {
    const random = mulberry32(7)
    sorted = [...idx]
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[sorted[i], sorted[j]] = [sorted[j], sorted[i]]
    }
  }

  const ranks = new Array<number>(n)
  sorted.forEach((tile, rank) => {
    ranks[tile] = rank
  })
  return ranks
}

function measureGridWidth() {
  if (typeof window === 'undefined') return 340
  const width = window.innerWidth
  return Math.min(Math.max(width * 0.34, 320), width * 0.88, 460)
}

/** "#rgb" or "#rrggbb" -> "r, g, b" for use inside rgba(). */
function toRgb(color: string) {
  const hex = color.replace('#', '')
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
  const n = parseInt(full, 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

/** Draws one frame of the ASCII four-leaf clover into `ctx` (CSS pixel units). */
function drawClover(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  ink: string,
  chaos = 0,
) {
  const fs = Math.max(8, Math.round(w / 40))
  const cw = fs * 0.62
  const ch = fs
  const nCols = Math.floor(w / cw)
  const nRows = Math.floor(h / ch)
  const offX = (w - nCols * cw) / 2
  const offY = (h - nRows * ch) / 2
  const s = w / 2

  ctx.clearRect(0, 0, w, h)
  ctx.font = `${fs}px ${MONO}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const sway = Math.sin(t * 0.9) * 0.1 + Math.sin(t * 0.37) * 0.05
  const breath = 1 + Math.sin(t * 1.6) * 0.035
  const cos = Math.cos(sway)
  const sin = Math.sin(sway)
  const frame = Math.floor(t * 7)

  // Stem: a curve that drifts down and to the left, swaying with time.
  const stem: Array<[number, number]> = []
  for (let k = 0; k <= 14; k++) {
    const u = k / 14
    stem.push([-0.38 * u * u + Math.sin(t * 1.3 + u * 2) * 0.04 * u, 0.1 + u * 0.95])
  }

  const AXIS_STEP = Math.PI / 2

  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      const px = offX + (c + 0.5) * cw
      const py = offY + (r + 0.5) * ch
      const x0 = (px - w / 2) / s
      const y0 = (py - h / 2) / s + 0.1
      const xr = (x0 * cos + y0 * sin) / breath
      const yr = (-x0 * sin + y0 * cos) / breath

      const d = Math.hypot(xr, yr)
      const th = Math.atan2(yr, xr)

      // Four lobes on the diagonals, each with a small heart-shaped notch.
      const lobe = Math.abs(Math.sin(2 * th))
      const m = (((th - Math.PI / 4) % AXIS_STEP) + AXIS_STEP) % AXIS_STEP
      const dAng = Math.min(m, AXIS_STEP - m)
      const notch = 1 - 0.34 * Math.exp(-Math.pow(dAng / 0.15, 2))
      const R = 0.74 * Math.pow(lobe, 0.65) * notch
      const f = R - d

      let idx = -1
      const wave = 0.5 + 0.5 * Math.sin(d * 9 - t * 3.2)

      if (f > 0 && d > 0.015) {
        const e = f / Math.max(R, 0.001)
        if (e < 0.1) idx = 9
        else if (dAng < 0.03 && d > 0.08) idx = 2
        else idx = Math.min(8, Math.max(2, Math.floor(2 + e * 5 + wave * 2)))
      } else if (d < 0.07) {
        idx = 8
      } else {
        let best = 9
        for (let k = 0; k < stem.length; k++) {
          const dx = xr - stem[k][0]
          const dy = yr - stem[k][1]
          const dd = dx * dx + dy * dy
          if (dd < best) best = dd
        }
        if (best < 0.0012) idx = 6 + Math.floor(wave * 2)
      }

      if (idx < 0) {
        // Faint drifting sparkles around the clover.
        if (hash(c, r, Math.floor(t * 2.5)) > 0.992) {
          ctx.fillStyle = `rgba(${ink}, 0.35)`
          ctx.fillText('.', px, py)
        }
        continue
      }

      let ch2 = RAMP[idx]
      if (hash(c, r, frame) < 0.06 + chaos * 0.5) {
        ch2 = GLITCH[Math.floor(hash(r, c, frame) * GLITCH.length)]
      }
      if (ch2 === ' ') continue

      ctx.fillStyle = `rgba(${ink}, ${0.3 + idx * 0.07})`
      ctx.fillText(ch2, px, py)
    }
  }
}

export function PageLoader({
  urls = NO_URLS,
  imageAspectRatio = 0.8,
  children,
  brand = 'Your brand',
  logo = '/assets/figma/logo-black.png',
  logoAlt = 'Logo',
  cols = 6,
  rows = 7,
  fillOrder = 'random',
  maxDuration = 9000,
  background = '#ffffff',
  foreground = '#000000',
  accent = '#000000',
  scrollToTopOnOpen = true,
  onComplete,
}: PageLoaderProps) {
  const urlsKey = JSON.stringify(urls)
  // Keep the preload list stable when callers pass a new array with identical URLs.
  // The logo is preloaded with everything else so it never pops in half-loaded.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allUrls = useMemo(() => Array.from(new Set(logo ? [...urls, logo] : urls)), [urlsKey, logo])
  const { progress } = useAssetPreload(allUrls)

  const [logoFailed, setLogoFailed] = useState(false)
  const showLogo = Boolean(logo) && !logoFailed

  const [phase, setPhase] = useState<Phase>('loading')
  const [count, setCount] = useState(0)
  const [gridW, setGridW] = useState(measureGridWidth)
  const [fontsReady, setFontsReady] = useState(
    () =>
      typeof document === 'undefined' || !document.fonts || document.fonts.status === 'loaded',
  )

  const numRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const tileRefs = useRef<Array<HTMLCanvasElement | null>>([])
  const realRef = useRef(0)
  const chaosRef = useRef(0)
  const onCompleteRef = useRef(onComplete)
  const total = cols * rows
  const ranks = useMemo(() => buildRanks(cols, rows, fillOrder), [cols, rows, fillOrder])
  const ink = toRgb(foreground)

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const ms = (value: number) => (reduceMotion ? 0 : value)

  const gap = Math.max(4, Math.round(gridW / 62))
  const gridH = gridW / imageAspectRatio
  const tileW = (gridW - gap * (cols - 1)) / cols
  const tileH = (gridH - gap * (rows - 1)) / rows
  const radius = Math.round(tileW * 0.14)

  useEffect(() => {
    const assets = allUrls.length ? progress * allUrls.length : 0
    realRef.current = (assets + (fontsReady ? 1 : 0)) / (allUrls.length + 1)
  }, [progress, allUrls.length, fontsReady])

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (fontsReady || typeof document === 'undefined' || !document.fonts) return
    let alive = true
    document.fonts.ready.then(() => {
      if (alive) setFontsReady(true)
    })
    return () => {
      alive = false
    }
  }, [fontsReady])

  useEffect(() => {
    const onResize = () => setGridW(measureGridWidth())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // The clover gets glitchier while it is pulled into the center.
  useEffect(() => {
    chaosRef.current = phase === 'popping' ? 0.45 : 0
  }, [phase])

  // ASCII clover: render the full animation to one offscreen canvas,
  // then slice it into every glass tile each frame.
  useEffect(() => {
    if (phase === 'done') return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const src = document.createElement('canvas')
    src.width = Math.round(gridW * dpr)
    src.height = Math.round(gridH * dpr)
    const sctx = src.getContext('2d')
    if (!sctx) return
    sctx.scale(dpr, dpr)

    let raf = 0
    const render = (now: number) => {
      const t = reduceMotion ? 0 : now / 1000
      drawClover(sctx, gridW, gridH, t, ink, chaosRef.current)

      for (let i = 0; i < total; i++) {
        const canvas = tileRefs.current[i]
        if (!canvas) continue
        const ctx = canvas.getContext('2d')
        if (!ctx) continue
        const col = i % cols
        const row = Math.floor(i / cols)
        const sx = col * (tileW + gap) * dpr
        const sy = row * (tileH + gap) * dpr
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(src, sx, sy, tileW * dpr, tileH * dpr, 0, 0, canvas.width, canvas.height)
      }
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [phase, gridW, gridH, tileW, tileH, gap, cols, total, reduceMotion, ink])

  // The counter keeps climbing through the swirl, so it is still reaching 100 as the clover moves.
  const counting = phase === 'loading' || phase === 'popping'
  useEffect(() => {
    if (!counting) return

    let raf = 0
    let shown = 0
    let popped = false
    const start = performance.now()
    let last = start

    const tick = (now: number) => {
      const dt = Math.min(now - last, 50)
      last = now
      const elapsed = now - start
      const timedOut = elapsed >= maxDuration
      const real = Math.max(realRef.current, 0.03)
      const target = timedOut ? 1 : real

      shown = timedOut
        ? 1
        : shown + (target - shown) * (1 - Math.exp(-dt / (reduceMotion ? 1 : 170)))
      if (target >= 1 && 1 - shown < 0.002) shown = 1

      const percentage = shown >= 1 ? 100 : Math.floor(shown * 100)
      if (numRef.current) numRef.current.textContent = String(percentage)
      if (barRef.current) barRef.current.style.transform = `scaleX(${shown})`
      const nextCount = shown >= 1 ? total : Math.floor(shown * total)
      setCount((previous) => (previous === nextCount ? previous : nextCount))

      if (!popped && shown >= SWIRL_AT) {
        popped = true
        setPhase('popping')
      }
      if (shown >= 1) return
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counting, maxDuration, total, reduceMotion])

  // Exit timeline: popping -> message -> opening -> done.
  // Each step owns one timer, and a step's timer is only cleared when the phase has moved on.
  useEffect(() => {
    if (phase === 'popping') {
      const timer = setTimeout(() => setPhase('message'), ms(POP_MS))
      return () => clearTimeout(timer)
    }
    if (phase === 'message') {
      const timer = setTimeout(() => setPhase('opening'), reduceMotion ? 700 : FINAL_HOLD)
      return () => clearTimeout(timer)
    }
    if (phase === 'opening') {
      const timer = setTimeout(() => {
        setPhase('done')
        onCompleteRef.current?.()
      }, ms(OPEN_MS + EXIT_STAGGER) + 80)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reduceMotion])

  const opening = phase === 'opening' || phase === 'done'

  useEffect(() => {
    if (phase === 'done') return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [phase])

  useLayoutEffect(() => {
    if (phase !== 'opening' || !scrollToTopOnOpen) return
    scrollToTarget(0, { behavior: 'instant' })
  }, [phase, scrollToTopOnOpen])

  const popping = phase === 'popping'
  const afterPop = phase !== 'loading' && phase !== 'popping'
  const dpr = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2)
  const showLogoStage = popping || phase === 'message' || phase === 'opening'

  const pageStyle: CSSProperties | undefined =
    phase === 'done'
      ? undefined
      : {
          transform: opening ? 'scale(1)' : 'scale(0.965)',
          transformOrigin: 'top center',
          filter: opening ? 'blur(0px)' : 'blur(12px)',
          opacity: opening ? 1 : 0.4,
          transition: `transform ${ms(1400)}ms ${EASE} ${opening ? ms(EXIT_STAGGER + 100) : 0}ms, filter ${ms(1100)}ms ${EASE} ${opening ? ms(EXIT_STAGGER + 100) : 0}ms, opacity ${ms(900)}ms ${EASE} ${opening ? ms(EXIT_STAGGER + 100) : 0}ms`,
          willChange: 'transform, filter, opacity',
        }

  return (
    <>
      <style>{`
        /* The push. Rotation and scale are separate properties around the grid's center, so each
           gets its own easing: rotation leads (a small pull-back, then a swift sweep that settles)
           while scale lags, which makes the tiles curve inward in a spiral and glide to rest. */
        @keyframes pl-spin {
          0%   { rotate: 0deg;        animation-timing-function: cubic-bezier(0.3, 0, 0.5, 1); }
          16%  { rotate: var(--wind); animation-timing-function: cubic-bezier(0.25, 0.05, 0.15, 1); }
          100% { rotate: var(--rot); }
        }
        @keyframes pl-shrink {
          0%   { scale: 1;    animation-timing-function: cubic-bezier(0.6, 0, 0.3, 1); }
          100% { scale: 0.04; }
        }
        @keyframes pl-dim {
          0%   { opacity: 1; filter: blur(0); }
          65%  { opacity: 1; filter: blur(0.6px); }
          100% { opacity: 0; filter: blur(1.4px); }
        }
        @keyframes pl-snap-ring {
          0%   { opacity: 0.9; transform: translate(-50%, -50%) scale(0.15); }
          100% { opacity: 0;   transform: translate(-50%, -50%) scale(7); }
        }
        /* The "stone": grows as the tiles arrive, then collapses with the snap. */
        @keyframes pl-snap-dot {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0); }
          20%  { opacity: 1; }
          72%  { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
        }
        /* Logo arrival: opens outward from the point where the stone snapped (like the ring),
           while it sharpens out of a soft blur and grows gently into place. */
        @keyframes pl-logo-in {
          0%   { opacity: 0; clip-path: circle(0% at 50% 50%);  filter: blur(10px); transform: scale(0.88); }
          35%  { opacity: 1; }
          100% { opacity: 1; clip-path: circle(75% at 50% 50%); filter: blur(0);    transform: scale(1); }
        }
      `}</style>

      <div style={pageStyle} aria-busy={phase === 'loading'}>
        {children}
      </div>

      {phase !== 'done' && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Loading"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            overflow: 'hidden',
            color: foreground,
            fontFamily: FONT,
            pointerEvents: opening ? 'none' : 'auto',
            // The whole loader lifts away like a curtain with a curved bottom edge.
            transform: opening ? 'translateY(-101%)' : 'translateY(0)',
            borderRadius: opening ? '0 0 50% 50% / 0 0 9vw 9vw' : '0',
            transition: `transform ${ms(OPEN_MS)}ms ${CURTAIN_EASE} ${ms(EXIT_STAGGER)}ms, border-radius ${ms(OPEN_MS)}ms ${CURTAIN_EASE} ${ms(EXIT_STAGGER)}ms`,
            willChange: 'transform',
          }}
        >
          {/* Base: solid background + clover. */}
          <div style={{ position: 'absolute', inset: 0, background }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                opacity: reduceMotion && phase !== 'loading' ? 0 : 1,
              }}
            >
              <div style={{ position: 'relative' }}>
                {/* The clover is pushed from its stem, tile by tile, spiraling into the center */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, ${tileW}px)`,
                    gap,
                    transformOrigin: '50% 50%',
                  }}
                >
                  {Array.from({ length: total }, (_, i) => {
                    const col = i % cols
                    const row = Math.floor(i / cols)
                    const on = popping || afterPop || ranks[i] < count
                    const dx = (col + 0.5 - cols / 2) * (tileW + gap)
                    const dy = (row + 0.5 - rows / 2) * (tileH + gap)

                    // The push starts where the clover's stem ends (bottom, a little left)
                    // and travels up through the clover, so stem-side tiles leave first.
                    const tx = (col + 0.5) * (tileW + gap)
                    const ty = (row + 0.5) * (tileH + gap)
                    const stemX = gridW * 0.31
                    const stemY = gridH / 2 + gridW * 0.475
                    const reach = Math.hypot(gridW, gridH * 0.9)
                    const fromStem = Math.min(1, Math.hypot(tx - stemX, ty - stemY) / reach)
                    const suckDelay = Math.round(fromStem * SWEEP_MS + hash(col, row, 17) * 30)

                    // A true spiral: each tile rotates and shrinks around the *grid's* center
                    // (its transform-origin), so rotation and scale can ease independently.
                    const spin = Math.round(210 + hash(col, row, 41) * 70)
                    const suck: CSSProperties & Record<string, string | number> = {
                      '--rot': `${spin}deg`,
                      '--wind': `${WIND_UP_DEG}deg`,
                    }
                    return (
                      <div
                        key={i}
                        style={{
                          ...suck,
                          position: 'relative',
                          width: tileW,
                          height: tileH,
                          borderRadius: radius,
                          overflow: 'hidden',
                          // Only pivot around the grid's center once the push starts (all tiles are
                          // filled by then, so the origin change is invisible).
                          transformOrigin: popping
                            ? `${tileW / 2 - dx}px ${tileH / 2 - dy}px`
                            : '50% 50%',
                          background: on ? `rgba(${ink}, 0)` : `rgba(${ink}, 0.06)`,
                          boxShadow: `inset 0 0 0 1px ${on ? `rgba(${ink}, 0)` : `rgba(${ink}, 0.2)`}`,
                          transform: on ? 'scale(1)' : 'scale(0.94)',
                          opacity: afterPop ? 0 : 1,
                          transition: `transform ${ms(900)}ms ${EASE}, background ${ms(500)}ms ease, box-shadow ${ms(500)}ms ease`,
                          animation:
                            popping && !reduceMotion
                              ? [
                                  `pl-spin ${TRAVEL_MS}ms linear ${suckDelay}ms both`,
                                  `pl-shrink ${TRAVEL_MS}ms linear ${suckDelay}ms both`,
                                  `pl-dim ${TRAVEL_MS}ms linear ${suckDelay}ms both`,
                                ].join(', ')
                              : 'none',
                        }}
                      >
                        <canvas
                          ref={(el) => {
                            tileRefs.current[i] = el
                          }}
                          width={Math.max(1, Math.round(tileW * dpr))}
                          height={Math.max(1, Math.round(tileH * dpr))}
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: tileW,
                            height: tileH,
                            opacity: on ? 1 : 0,
                            transform: on ? 'scale(1)' : 'scale(1.18)',
                            transition: `opacity ${ms(450)}ms ease, transform ${ms(900)}ms ${EASE}`,
                          }}
                        />
                      </div>
                    )
                  })}
                </div>

                {/* The snap: a dot collapses and a thin ring flicks outward */}
                {popping && !reduceMotion && (
                  <>
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: foreground,
                        pointerEvents: 'none',
                        animation: `pl-snap-dot ${SUCK_MS - 140}ms linear ${Math.round(SWEEP_MS * 0.9)}ms both`,
                      }}
                    />
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        border: `1.5px solid ${foreground}`,
                        pointerEvents: 'none',
                        animation: `pl-snap-ring 620ms ${EASE} ${SUCK_MS - 100}ms both`,
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Logo: eases in after the snap, then shrinks and drifts up as the curtain lifts */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              pointerEvents: 'none',
              opacity: showLogoStage ? 1 : 0,
              transition: `opacity ${ms(450)}ms ease`,
            }}
          >
            {showLogoStage && (
              <div
                style={{
                  transform: opening ? 'translateY(-12vh) scale(0.4)' : 'translateY(0) scale(1)',
                  opacity: opening ? 0 : 1,
                  transition: `transform ${ms(OPEN_MS)}ms ${CURTAIN_EASE}, opacity ${ms(OPEN_MS * 0.55)}ms ease-in`,
                }}
              >
                {showLogo && (
                  <img
                    src={logo}
                    alt={logoAlt}
                    draggable={false}
                    onError={() => setLogoFailed(true)}
                    style={{
                      display: 'block',
                      width: 'clamp(150px, 20vw, 260px)',
                      height: 'auto',
                      userSelect: 'none',
                      animation: reduceMotion
                        ? 'none'
                        : `pl-logo-in ${LOGO_IN_MS}ms ${LOGO_EASE} ${LOGO_IN_DELAY}ms both`,
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Brand, counter and progress bar */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(20px, 3vw, 36px)',
              left: 'clamp(20px, 3vw, 40px)',
              right: 'clamp(20px, 3vw, 40px)',
              display: 'flex',
              alignItems: 'center',
              transform: opening ? 'translateY(-10vh)' : 'translateY(0)',
              transition: `transform ${ms(OPEN_MS)}ms ${CURTAIN_EASE} ${ms(EXIT_STAGGER)}ms`,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {brand}
            </span>
          </div>

          <div
            style={{
              position: 'absolute',
              right: 'clamp(20px, 3vw, 40px)',
              bottom: 'clamp(20px, 3.5vw, 44px)',
              display: 'flex',
              alignItems: 'flex-start',
              lineHeight: 0.85,
              color: accent,
              transform: opening ? 'translateY(-26vh)' : 'translateY(0)',
              transition: `transform ${ms(OPEN_MS)}ms ${CURTAIN_EASE} ${ms(EXIT_STAGGER)}ms`,
            }}
          >
            <span
              ref={numRef}
              style={{
                fontSize: 'clamp(88px, 13vw, 176px)',
                fontWeight: 500,
                letterSpacing: '-0.05em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              0
            </span>
            <sup
              style={{
                fontSize: 'clamp(18px, 2vw, 30px)',
                opacity: 0.6,
                marginLeft: 6,
                marginTop: 6,
              }}
            >
              %
            </sup>
          </div>

          <div
            ref={barRef}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 3,
              background: accent,
              transform: 'scaleX(0)',
              transformOrigin: 'left center',
              willChange: 'transform',
            }}
          />
        </div>
      )}
    </>
  )
}