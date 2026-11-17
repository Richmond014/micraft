import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useReducedMotion } from '../../hooks/useMediaQuery'

const archiveAsset = '/assets/figma/archive/'
type WorkImage = { src: string; alt: string; kind: 'mobile' | 'web' }

const workImages: WorkImage[] = [
  { src: 'loop-phone-left.png', alt: 'LOOP mobile booking screen', kind: 'mobile' },
  { src: 'aws-skill-builder.png', alt: 'AWS Skill Builder website', kind: 'web' },
  { src: 'bantay.png', alt: 'Bantay flood monitoring website', kind: 'web' },
  { src: 'cloud-club-website.png', alt: 'AWS Cloud Club PUP website', kind: 'web' },
  { src: 'cloud-club-official.png', alt: 'AWS Cloud Club PUP official website', kind: 'web' },
  { src: 'hanapbuhay.png', alt: 'Hanapbuhay website', kind: 'web' },
  { src: 'ease-service-splash.png', alt: 'EaseService mobile app', kind: 'mobile' },
  { src: 'spotify-screen-left.png', alt: 'Spotify redesign mobile screen', kind: 'mobile' },
  { src: 'loop-phone-right.png', alt: 'LOOP driver tracking screen', kind: 'mobile' },
  { src: 'ease-service-home.png', alt: 'EaseService home screen', kind: 'mobile' },
  { src: 'spotify-screen-right.png', alt: 'Spotify redesign library screen', kind: 'mobile' },
]

/* ------------------------------------------------------------------ */
/* Tunables                                                            */
/* ------------------------------------------------------------------ */
const TILE_COUNT = 32
const RADIUS = 0.46
const PERSPECTIVE = 3
const AUTO_SPEED = 0.012
const REST_TILT = 12
const DRAG_SENSITIVITY = 0.4

/* macOS look */
const ACCENT = '#0A84FF' // macOS system blue. Set back to '#049FD9' for the Cisco blue.
const WINDOW_CHROME = true // macOS title bar + traffic lights on the website tiles
const TILE_SHADOW = '0 1px 4px rgba(0,0,0,0.2)'

const EDGE_NEIGHBORS = 2
const RING_RADIUS = RADIUS * 1.08
const RING_SEGMENTS = 72
const DEG = Math.PI / 180

/* Performance tunables */
const MAX_DPR = 1 // canvas backing resolution cap (1 = lightest)
const EXTENT = 1.3
// The 3D tile rotation is updated on EVERY display frame (it's cheap and runs
// on the compositor). The line/node canvases are redrawn at most this often:
const MIN_CANVAS_MS = 10.5 // ~ up to 90fps; on a 120Hz screen this becomes 60fps
const LOW_POWER_CANVAS_MS = 33 // ~30fps, only used if the device is struggling

/* Depth buckets: lines/dots of similar depth share one stroke/fill call */
const EDGE_BUCKETS = 6
const NODE_BUCKETS = 5
const RING_BUCKETS = 4

type V3 = [number, number, number]

const GOLDEN_ANGLE = 137.50776
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const tiles = Array.from({ length: TILE_COUNT }, (_, i) => {
  const y = 1 - (2 * (i + 0.5)) / TILE_COUNT
  const lat = (Math.asin(y) * 180) / Math.PI + (rand(i + 1) - 0.5) * 8
  const lon = ((i * GOLDEN_ANGLE) % 360) + (rand(i + 50) - 0.5) * 12
  const image = workImages[(i * 7) % workImages.length]
  const base: V3 = [
    RADIUS * Math.cos(lat * DEG) * Math.sin(lon * DEG),
    -RADIUS * Math.sin(lat * DEG),
    RADIUS * Math.cos(lat * DEG) * Math.cos(lon * DEG),
  ]
  return {
    ...image,
    base,
    lat,
    lon,
    roll: (rand(i + 100) - 0.5) * 60,
    size: 0.72 + rand(i + 150) * 0.32,
  }
})

const tileBase = new Float32Array(TILE_COUNT * 3)
tiles.forEach((t, i) => tileBase.set(t.base, i * 3))
const rot = new Float32Array(TILE_COUNT * 3)
const projX = new Float32Array(TILE_COUNT)
const projY = new Float32Array(TILE_COUNT)
const projS = new Float32Array(TILE_COUNT)
const nodeBucket = new Uint8Array(TILE_COUNT)

const edges: [number, number][] = []
{
  const seen = new Set<string>()
  tiles.forEach((a, i) => {
    tiles
      .map((b, j) => ({ j, d: (a.base[0] - b.base[0]) ** 2 + (a.base[1] - b.base[1]) ** 2 + (a.base[2] - b.base[2]) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, EDGE_NEIGHBORS)
      .forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`
        if (seen.has(key)) return
        seen.add(key)
        edges.push([Math.min(i, j), Math.max(i, j)])
      })
  })
}
const edgeBucket = new Uint8Array(edges.length)

const pulses = edges
  .map((_, edge) => ({ edge, speed: 0.14 + rand(edge + 300) * 0.22, phase: rand(edge + 400) }))
  .filter((_, i) => i % 2 === 0)

const rings = [
  { tx: 72, tz: 0, speed: 0.00055 },
  { tx: 72, tz: 60, speed: -0.0007 },
  { tx: 72, tz: -60, speed: 0.0009 },
].map(({ tx, tz, speed }) => {
  const point = (a: number): V3 => {
    const x = Math.cos(a) * RING_RADIUS
    const y = Math.sin(a) * RING_RADIUS
    const y1 = y * Math.cos(tx * DEG)
    const z1 = y * Math.sin(tx * DEG)
    return [x * Math.cos(tz * DEG) - y1 * Math.sin(tz * DEG), x * Math.sin(tz * DEG) + y1 * Math.cos(tz * DEG), z1]
  }
  const samples = new Float32Array((RING_SEGMENTS + 1) * 3)
  for (let i = 0; i <= RING_SEGMENTS; i++) samples.set(point((i / RING_SEGMENTS) * Math.PI * 2), i * 3)
  return {
    point,
    samples,
    rotated: new Float32Array((RING_SEGMENTS + 1) * 3),
    proj: new Float32Array((RING_SEGMENTS + 1) * 3), // screen x, screen y, rotated z
    speed,
  }
})
type Ring = (typeof rings)[number]
const electrons = rings.flatMap((ring) => [0, 1].map((k) => ({ ring, offset: k * Math.PI })))
const electronRot = new Float32Array(3)

const depthOf = (z: number) => (z / RADIUS + 1) / 2
const bucketOf = (depth: number, count: number) => Math.min(count - 1, Math.max(0, Math.floor(depth * count)))

/* ------------------------------------------------------------------ */
/* Canvas network renderer                                             */
/* ------------------------------------------------------------------ */
type Gfx = {
  back: CanvasRenderingContext2D
  front: CanvasRenderingContext2D
  glow: HTMLCanvasElement
}

/* Pre-rendered soft glow sprite: far cheaper than a live drop-shadow filter. */
const makeGlow = (hex: string) => {
  const size = 64
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const r = parseInt(hex.slice(1, 3), 16)
  const gr = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, `rgba(${r},${gr},${b},0.85)`)
  grad.addColorStop(0.35, `rgba(${r},${gr},${b},0.3)`)
  grad.addColorStop(1, `rgba(${r},${gr},${b},0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  return c
}

const rotateInto = (
  cx: number, sx: number, cy: number, sy: number,
  x: number, y: number, z: number,
  out: Float32Array, o: number,
) => {
  const x1 = x * cy + z * sy
  const z1 = -x * sy + z * cy
  out[o] = x1
  out[o + 1] = y * cx - z1 * sx
  out[o + 2] = y * sx + z1 * cx
}

/* One stroke per depth bucket instead of one per segment. */
const strokeRing = (ctx: CanvasRenderingContext2D, ring: Ring, wantFront: boolean, maxAlpha: number) => {
  const p = ring.proj
  for (let b = 0; b < RING_BUCKETS; b++) {
    let any = false
    ctx.beginPath()
    for (let i = 0; i < RING_SEGMENTS; i++) {
      const o = i * 3
      const zMid = (p[o + 2] + p[o + 5]) / 2
      if (zMid >= 0 !== wantFront) continue
      if (bucketOf(depthOf(zMid), RING_BUCKETS) !== b) continue
      ctx.moveTo(p[o], p[o + 1])
      ctx.lineTo(p[o + 3], p[o + 4])
      any = true
    }
    if (any) {
      ctx.globalAlpha = maxAlpha * (0.6 + 0.4 * ((b + 0.5) / RING_BUCKETS))
      ctx.stroke()
    }
  }
}

const drawNetwork = (gfx: Gfx, S: number, dpr: number, ax: number, ay: number, time: number, animate: boolean) => {
  const { back, front, glow } = gfx
  const k = S / EXTENT
  const c = S / 2
  const cx = Math.cos(ax)
  const sx = Math.sin(ax)
  const cy = Math.cos(ay)
  const sy = Math.sin(ay)

  back.clearRect(0, 0, S, S)
  front.clearRect(0, 0, S, S)
  back.lineCap = 'round'
  front.lineCap = 'round'

  /* Rotate + project everything ONCE per frame (previously re-done per edge/segment). */
  for (let i = 0; i < TILE_COUNT; i++) {
    const o = i * 3
    rotateInto(cx, sx, cy, sy, tileBase[o], tileBase[o + 1], tileBase[o + 2], rot, o)
    const s = PERSPECTIVE / (PERSPECTIVE - rot[o + 2])
    projS[i] = s
    projX[i] = c + rot[o] * s * k
    projY[i] = c + rot[o + 1] * s * k
    nodeBucket[i] = bucketOf(depthOf(rot[o + 2]), NODE_BUCKETS)
  }
  for (const ring of rings) {
    for (let i = 0; i <= RING_SEGMENTS; i++) {
      const o = i * 3
      rotateInto(cx, sx, cy, sy, ring.samples[o], ring.samples[o + 1], ring.samples[o + 2], ring.rotated, o)
      const z = ring.rotated[o + 2]
      const s = PERSPECTIVE / (PERSPECTIVE - z)
      ring.proj[o] = c + ring.rotated[o] * s * k
      ring.proj[o + 1] = c + ring.rotated[o + 1] * s * k
      ring.proj[o + 2] = z
    }
  }

  /* ---- back layer ---- */
  back.strokeStyle = ACCENT
  back.lineWidth = dpr
  for (const ring of rings) strokeRing(back, ring, false, 0.4)

  // thin, quiet links: batched by depth
  for (let e = 0; e < edges.length; e++) {
    const [a, b] = edges[e]
    edgeBucket[e] = bucketOf(depthOf((rot[a * 3 + 2] + rot[b * 3 + 2]) / 2), EDGE_BUCKETS)
  }
  for (let bucket = 0; bucket < EDGE_BUCKETS; bucket++) {
    let any = false
    back.beginPath()
    for (let e = 0; e < edges.length; e++) {
      if (edgeBucket[e] !== bucket) continue
      const [a, b] = edges[e]
      back.moveTo(projX[a], projY[a])
      back.lineTo(projX[b], projY[b])
      any = true
    }
    if (any) {
      back.globalAlpha = 0.1 + 0.5 * ((bucket + 0.5) / EDGE_BUCKETS)
      back.stroke()
    }
  }

  // small white nodes with a hairline accent ring: batched by depth
  back.fillStyle = '#fff'
  back.lineWidth = 1.2 * dpr
  for (let bucket = 0; bucket < NODE_BUCKETS; bucket++) {
    let any = false
    back.beginPath()
    for (let i = 0; i < TILE_COUNT; i++) {
      if (nodeBucket[i] !== bucket) continue
      const r = 0.0055 * projS[i] * k
      back.moveTo(projX[i] + r, projY[i])
      back.arc(projX[i], projY[i], r, 0, Math.PI * 2)
      any = true
    }
    if (any) {
      back.globalAlpha = 0.2 + 0.7 * ((bucket + 0.5) / NODE_BUCKETS)
      back.fill()
      back.stroke()
    }
  }

  if (animate) {
    back.fillStyle = ACCENT
    for (const p of pulses) {
      const [a, b] = edges[p.edge]
      const u = (time * 0.001 * p.speed + p.phase) % 1
      const x = projX[a] + (projX[b] - projX[a]) * u
      const y = projY[a] + (projY[b] - projY[a]) * u
      const z = rot[a * 3 + 2] + (rot[b * 3 + 2] - rot[a * 3 + 2]) * u
      const sc = PERSPECTIVE / (PERSPECTIVE - z)
      const alpha = Math.sin(Math.PI * u) * (0.3 + 0.7 * depthOf(z))
      const r = 0.005 * sc * k
      back.globalAlpha = alpha * 0.8
      back.drawImage(glow, x - r * 4, y - r * 4, r * 8, r * 8)
      back.globalAlpha = alpha
      back.beginPath()
      back.arc(x, y, r, 0, Math.PI * 2)
      back.fill()
    }
  }
  back.globalAlpha = 1

  /* ---- front layer ---- */
  front.strokeStyle = ACCENT
  front.lineWidth = dpr
  for (const ring of rings) strokeRing(front, ring, true, 0.8)

  front.fillStyle = '#fff'
  front.strokeStyle = ACCENT
  front.lineWidth = dpr
  for (const e of electrons) {
    const [x, y, z] = e.ring.point(time * e.ring.speed + e.offset)
    rotateInto(cx, sx, cy, sy, x, y, z, electronRot, 0)
    const sc = PERSPECTIVE / (PERSPECTIVE - electronRot[2])
    const alpha = 0.4 + 0.6 * depthOf(electronRot[2])
    const px = c + electronRot[0] * sc * k
    const py = c + electronRot[1] * sc * k
    const r = 0.0085 * sc * k
    front.globalAlpha = alpha * 0.9
    front.drawImage(glow, px - r * 4.5, py - r * 4.5, r * 9, r * 9)
    front.globalAlpha = alpha
    front.beginPath()
    front.arc(px, py, r, 0, Math.PI * 2)
    front.fill()
    front.stroke()
  }
  front.globalAlpha = 1
}

/* ------------------------------------------------------------------ */

type PointerDrag = { pointerId: number; x: number; y: number; t: number }

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const overflowPct = `${(-(EXTENT - 1) / 2) * 100}%`
const canvasStyle = { left: overflowPct, top: overflowPct, width: `${EXTENT * 100}%`, height: `${EXTENT * 100}%` }

/* macOS traffic lights, painted as three tiny gradients (no extra DOM nodes). */
const trafficDot = (color: string, x: string) =>
  `radial-gradient(circle closest-side, ${color} 88%, transparent 100%) ${x} 50% / var(--dot) var(--dot) no-repeat`
const TITLEBAR_BG = `${trafficDot('#ff5f57', '7%')}, ${trafficDot('#febc2e', '17%')}, ${trafficDot('#28c840', '27%')}, linear-gradient(#f8f8f8, #e8e8e8)`

export function WorkPhotoSphere() {
  const reducedMotion = useReducedMotion()
  const rootRef = useRef<HTMLButtonElement>(null)
  const sphereRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLCanvasElement>(null)
  const frontRef = useRef<HTMLCanvasElement>(null)
  const drag = useRef<PointerDrag | null>(null)
  const clock = useRef(0)
  const requestDraw = useRef<() => void>(() => {})
  const state = useRef({ rx: REST_TILT, ry: 0, vx: 0, vy: reducedMotion ? 0 : AUTO_SPEED })

  useEffect(() => {
    const root = rootRef.current
    const backC = backRef.current
    const frontC = frontRef.current
    if (!root || !backC || !frontC) return
    const back = backC.getContext('2d')
    const front = frontC.getContext('2d')
    if (!back || !front) return

    const gfx: Gfx = { back, front, glow: makeGlow(ACCENT) }
    let width = 0
    let S = 0
    let dpr = 1
    let frame = 0
    let pending = 0
    let last = 0
    let lastCanvas = 0
    let inView = true
    let lowPower = false // set (and kept) if this device can't keep up
    let strain = 0

    const updateSphereTransform = () => {
      const { rx, ry } = state.current
      if (sphereRef.current) {
        sphereRef.current.style.transform = `rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`
      }
    }
    const paintCanvas = (time: number, animate: boolean) => {
      if (!S) return
      const { rx, ry } = state.current
      drawNetwork(gfx, S, dpr, rx * DEG, ry * DEG, time, animate)
      lastCanvas = time
    }
    const render = (time: number, animate: boolean) => {
      updateSphereTransform()
      paintCanvas(time, animate)
    }

    const resize = () => {
      const w = root.clientWidth
      const nextDpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      if (w === width && nextDpr === dpr) return // nothing actually changed
      width = w
      dpr = nextDpr
      root.style.setProperty('--s', `${w}px`)
      S = Math.round(w * EXTENT * dpr)
      backC.width = backC.height = S
      frontC.width = frontC.height = S
      render(clock.current, !drag.current && !reducedMotion)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(root)
    resize()

    // Used when the loop isn't running (reduced motion) or to repaint on demand
    requestDraw.current = () => {
      if (frame || pending) return
      pending = requestAnimationFrame((time) => {
        pending = 0
        clock.current = time
        render(time, !drag.current && !reducedMotion)
      })
    }

    const tick = (time: number) => {
      frame = requestAnimationFrame(tick)
      const interval = last ? time - last : 16.7
      const dt = Math.min(interval, 40)
      last = time
      clock.current = time
      const s = state.current
      const dragging = !!drag.current

      if (!dragging) {
        s.ry += s.vy * dt
        s.rx = clamp(s.rx + s.vx * dt, -70, 70)
        const k = Math.min(1, dt * 0.004)
        s.vy += (AUTO_SPEED - s.vy) * k
        s.vx *= 1 - k
        s.rx += (REST_TILT - s.rx) * Math.min(1, dt * 0.002)
      }

      // 1) Tile rotation: every display frame. Cheap, so motion stays fluid.
      updateSphereTransform()

      // 2) Line/node canvases: paced by real elapsed time (no more skipped-frame judder).
      //    Always repaint while dragging / flinging so lines never trail the tiles.
      const degreesThisFrame = Math.max(Math.abs(s.vx), Math.abs(s.vy)) * dt
      const moving = dragging || degreesThisFrame > 0.6
      const gap = lowPower && !moving ? LOW_POWER_CANVAS_MS : MIN_CANVAS_MS
      if (time - lastCanvas >= gap) {
        const t0 = performance.now()
        paintCanvas(time, !dragging && !reducedMotion)
        const cost = performance.now() - t0

        // Adaptive quality: if painting is slow or the page is dropping frames for a
        // sustained period, step the canvas down to ~30fps so the rest of the page stays smooth.
        if (cost > 8 || interval > 28) strain = Math.min(60, strain + 2)
        else strain = Math.max(0, strain - 1)
        if (strain >= 40) lowPower = true
      }
    }

    const sync = () => {
      const run = !reducedMotion && inView && document.visibilityState === 'visible'
      if (run && !frame) {
        last = 0
        lastCanvas = 0
        frame = requestAnimationFrame(tick)
      } else if (!run && frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    }

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            ([entry]) => {
              inView = entry.isIntersecting
              sync()
            },
            { rootMargin: '100px' },
          )
        : null
    io?.observe(root)
    document.addEventListener('visibilitychange', sync)
    sync()

    return () => {
      observer.disconnect()
      io?.disconnect()
      document.removeEventListener('visibilitychange', sync)
      cancelAnimationFrame(frame)
      cancelAnimationFrame(pending)
      requestDraw.current = () => {}
    }
  }, [reducedMotion])

  return (
    <button
      ref={rootRef}
      type="button"
      aria-label="Drag to rotate a sphere of project images"
      onPointerDown={(event) => {
        if (event.button !== 0 && event.pointerType === 'mouse') return
        drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, t: performance.now() }
        state.current.vx = 0
        state.current.vy = 0
        if (event.isTrusted) event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        const start = drag.current
        if (!start || start.pointerId !== event.pointerId) return
        const now = performance.now()
        const dt = Math.max(now - start.t, 1)
        const dx = (event.clientX - start.x) * DRAG_SENSITIVITY
        const dy = (event.clientY - start.y) * DRAG_SENSITIVITY
        const s = state.current
        s.ry += dx
        s.rx = clamp(s.rx - dy, -70, 70)
        s.vy = 0.6 * (dx / dt) + 0.4 * s.vy
        s.vx = 0.6 * (-dy / dt) + 0.4 * s.vx
        // mutate instead of allocating a new object on every pointer event
        start.x = event.clientX
        start.y = event.clientY
        start.t = now
        requestDraw.current()
      }}
      onPointerUp={(event) => {
        const start = drag.current
        if (start?.pointerId !== event.pointerId) return
        if (performance.now() - start.t > 80) {
          state.current.vx = 0
          state.current.vy = 0
        }
        drag.current = null
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
        requestDraw.current()
      }}
      onPointerCancel={() => {
        drag.current = null
        requestDraw.current()
      }}
      onKeyDown={(event) => {
        const direction = { ArrowLeft: -0.06, ArrowRight: 0.06 }[event.key]
        if (direction === undefined) return
        event.preventDefault()
        state.current.vy = direction
        if (reducedMotion) {
          state.current.ry += direction * 300
          requestDraw.current()
        }
      }}
      className="relative block aspect-square w-full cursor-grab touch-none select-none rounded-full border-0 bg-transparent p-0 outline-none [--s:400px] active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60 focus-visible:ring-offset-4"
    >
      <span className="sr-only">A rotating 3D collection of project screenshots</span>

      {/* Contact shadow: tight core + wide soft falloff, like a macOS window resting on a surface */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[16%] bottom-[-5%] h-[11%]"
        style={{ background: 'radial-gradient(ellipse closest-side, rgba(0,0,0,0.30), rgba(0,0,0,0.10) 55%, transparent 100%)' }}
      />
      {/* Soft accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(circle closest-side at 50% 50%, ${ACCENT}26 0%, ${ACCENT}0d 55%, transparent 100%)` }}
      />

      {/* Back layer: links, nodes, packets, back half of the rings */}
      <canvas ref={backRef} aria-hidden className="pointer-events-none absolute" style={canvasStyle} />

      {/* Perspective wrapper */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ perspective: `calc(var(--s) * ${PERSPECTIVE})`, perspectiveOrigin: '50% 50%' }}
      >
        <div
          ref={sphereRef}
          className="absolute inset-0 will-change-transform [transform-style:preserve-3d]"
          style={{ transform: `rotateX(${REST_TILT}deg) rotateY(0deg)` }}
        >
          {tiles.map((tile, index) => {
            const mobile = tile.kind === 'mobile'
            const chrome = WINDOW_CHROME && !mobile
            return (
              <div
                key={`${tile.src}-${index}`}
                className="absolute left-1/2 top-1/2 flex max-w-none flex-col overflow-hidden bg-white"
                style={
                  {
                    width: `calc(var(--s) * ${(mobile ? 0.075 : 0.115) * tile.size})`,
                    height: `calc(var(--s) * ${(mobile ? 0.12 : 0.078) * tile.size})`,
                    // iOS-like rounded corners on phones, macOS-window corners on websites
                    borderRadius: `calc(var(--s) * ${(mobile ? 0.014 : 0.006) * tile.size})`,
                    boxShadow: TILE_SHADOW,
                    backfaceVisibility: 'hidden',
                    '--dot': `calc(var(--s) * ${0.0045 * tile.size})`,
                    transform: `translate(-50%, -50%) rotateY(${tile.lon}deg) rotateX(${tile.lat}deg) translateZ(calc(var(--s) * ${RADIUS})) rotateZ(${tile.roll}deg)`,
                  } as CSSProperties
                }
              >
                {chrome && (
                  <span
                    aria-hidden
                    className="block flex-none"
                    style={{ height: '14%', background: TITLEBAR_BG, boxShadow: 'inset 0 -0.5px 0 rgba(0,0,0,0.14)' }}
                  />
                )}
                <img
                  src={`${archiveAsset}${tile.src}`}
                  alt=""
                  draggable={false}
                  decoding="async"
                  loading="lazy"
                  className="block min-h-0 w-full flex-1"
                  style={{ objectFit: mobile ? 'contain' : 'cover' }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Subtle glass highlight: one static layer, so it costs nothing per frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle closest-side at 34% 28%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 55%)' }}
      />

      {/* Front layer: front half of the rings and electrons */}
      <canvas ref={frontRef} aria-hidden className="pointer-events-none absolute" style={canvasStyle} />
    </button>
  )
}