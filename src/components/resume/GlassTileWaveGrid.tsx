import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../../hooks/useMediaQuery'

type Wave = {
  x: number
  y: number
  start: number
}

type PatternKind = 'checker' | 'ring' | 'dot'

const WAVE_DURATION = 1150
const LIFT_LEVELS = 10
const SHADOW_PAD = 28 // css px of room around a tile sprite for its shadow
const PATTERN_COLOR = 'rgb(150, 158, 164)'

/* ------------------------------------------------------------------ */
/* Sprite builders: all the expensive drawing (shadows, gradients,     */
/* paths) happens ONCE here, never inside the animation loop.          */
/* ------------------------------------------------------------------ */

function createCanvas(cssSize: number, pixelRatio: number) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.ceil(cssSize * pixelRatio))
  canvas.height = canvas.width
  return canvas
}

function buildTileSprite(tileSize: number, pixelRatio: number, level: number) {
  const lift = level / LIFT_LEVELS
  const size = tileSize + lift * 2.5
  const canvas = createCanvas(tileSize + 2.5 + SHADOW_PAD * 2, pixelRatio)
  const context = canvas.getContext('2d')
  if (!context) return canvas

  context.scale(pixelRatio, pixelRatio)
  const center = canvas.width / pixelRatio / 2
  const x = center - size / 2
  const y = center - size / 2
  const radius = size * 0.23

  const mix = Math.min(1, lift * 4)
  const face = context.createLinearGradient(x, y, x + size, y + size)
  face.addColorStop(0, '#ffffff')
  face.addColorStop(1, `rgb(${245 - 4 * mix}, ${246 - mix}, ${246 + 2 * mix})`)

  context.shadowColor = `rgba(45, 59, 72, ${0.035 + lift * 0.09})`
  context.shadowBlur = 5 + lift * 13
  context.shadowOffsetY = 2 + lift * 5
  context.beginPath()
  context.roundRect(x, y, size, size, radius)
  context.fillStyle = face
  context.fill()

  context.shadowColor = 'transparent'
  context.shadowBlur = 0
  context.shadowOffsetY = 0
  context.strokeStyle = 'rgba(190, 198, 204, 0.36)'
  context.lineWidth = 0.8
  context.stroke()

  return canvas
}

function buildPatternSprite(kind: PatternKind, tileSize: number, pixelRatio: number) {
  const canvas = createCanvas(tileSize, pixelRatio)
  const context = canvas.getContext('2d')
  if (!context) return canvas

  context.scale(pixelRatio, pixelRatio)
  context.fillStyle = PATTERN_COLOR
  context.strokeStyle = PATTERN_COLOR

  if (kind === 'checker') {
    const inset = tileSize * 0.2
    const cells = 4
    const cellSize = (tileSize - inset * 2) / cells
    for (let row = 0; row < cells; row += 1) {
      for (let column = 0; column < cells; column += 1) {
        if ((row + column) % 2 === 0) {
          context.fillRect(inset + column * cellSize, inset + row * cellSize, cellSize, cellSize)
        }
      }
    }
  } else if (kind === 'ring') {
    context.beginPath()
    context.arc(tileSize / 2, tileSize / 2, tileSize * 0.28, 0, Math.PI * 2)
    context.lineWidth = Math.max(1, tileSize * 0.025)
    context.stroke()
  } else {
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        context.beginPath()
        context.arc(tileSize * (0.32 + column * 0.18), tileSize * (0.32 + row * 0.18), tileSize * 0.035, 0, Math.PI * 2)
        context.fill()
      }
    }
  }

  return canvas
}

/* ------------------------------------------------------------------ */

export function GlassTileWaveGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const surface = canvas?.parentElement
    const context = canvas?.getContext('2d')
    if (!canvas || !surface || !context) return

    let width = 0
    let height = 0
    let pixelRatio = 1
    let frame = 0
    let resizeFrame = 0
    let lastTime = 0
    let inViewport = true

    const waves: Wave[] = []
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, targetStrength: 0 }
    let pointerActive = false
    let snapPointer = false

    // Layout + cached sprites (rebuilt only when the size changes)
    let tileSize = 0
    let step = 0
    let columns = 0
    let rows = 0
    let startX = 0
    let reach = 0
    let spriteCss = 0
    let patterns = new Float32Array(0)
    let patternBlocked = new Uint8Array(0)
    let tileSprites: HTMLCanvasElement[] = []
    let patternSprites: Record<PatternKind, HTMLCanvasElement> | null = null
    let baseCanvas: HTMLCanvasElement | null = null

    const canAnimate = () => inViewport && !document.hidden

    const schedule = () => {
      if (!frame && canAnimate()) frame = requestAnimationFrame(draw)
    }

    const getTileSprite = (level: number) => {
      return tileSprites[level] ?? tileSprites[0]
    }

    const buildLayout = () => {
      tileSize = Math.min(72, Math.max(44, width / 12))
      const gap = Math.max(6, tileSize * 0.11)
      step = tileSize + gap
      columns = Math.ceil(width / step)
      rows = Math.ceil(height / step)
      startX = (width - (columns * step - gap)) / 2
      reach = Math.hypot(width, height) * 0.8

      patterns = new Float32Array(columns * rows)
      patternBlocked = new Uint8Array(columns * rows)

      // Keep decorative marks out from underneath text and controls. The tiles
      // still run behind these areas; only their high-contrast motifs move to
      // the surrounding open space.
      const surfaceBounds = surface.getBoundingClientRect()
      const contentRects = Array.from(
        surface.querySelectorAll<HTMLElement>(
          '.rp-head, .rp-intro, .rp-pill, .rp-section-title, .rp-entry-title, .rp-muted, #contact, .rp-footer-space > footer > p',
        ),
        (element) => {
          const bounds = element.getBoundingClientRect()
          return {
            left: bounds.left - surfaceBounds.left - 5,
            right: bounds.right - surfaceBounds.left + 5,
            top: bounds.top - surfaceBounds.top - 4,
            bottom: bounds.bottom - surfaceBounds.top + 4,
          }
        },
      )

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const index = row * columns + column
          const hash = Math.sin((column + 1) * 127.1 + (row + 1) * 311.7 + 817.3) * 43758.5453
          patterns[index] = hash - Math.floor(hash)
          const left = startX + column * step
          const top = row * step
          patternBlocked[index] = contentRects.some((rect) =>
            left < rect.right && left + tileSize > rect.left && top < rect.bottom && top + tileSize > rect.top,
          ) ? 1 : 0
        }
      }

      // Move motifs that would land in content areas to the nearest free tile
      // outside those areas, rather than simply leaving a blank motif slot.
      const claimed = new Uint8Array(patterns.length)
      for (let source = 0; source < patterns.length; source += 1) {
        const motif = patterns[source]
        if (!patternBlocked[source] || motif >= 0.37) continue

        const sourceRow = Math.floor(source / columns)
        const sourceColumn = source % columns
        let destination = -1
        let nearestDistance = Infinity
        for (let candidate = 0; candidate < patterns.length; candidate += 1) {
          if (patternBlocked[candidate] || claimed[candidate] || patterns[candidate] < 0.37) continue
          const rowDistance = Math.floor(candidate / columns) - sourceRow
          const columnDistance = (candidate % columns) - sourceColumn
          const distance = rowDistance * rowDistance + columnDistance * columnDistance
          if (distance < nearestDistance) {
            nearestDistance = distance
            destination = candidate
          }
        }

        patterns[source] = 1
        if (destination >= 0) {
          patterns[destination] = motif
          claimed[destination] = 1
        }
      }

      tileSprites = Array.from(
        { length: LIFT_LEVELS + 1 },
        (_, level) => buildTileSprite(tileSize, pixelRatio, level),
      )
      patternSprites = {
        checker: buildPatternSprite('checker', tileSize, pixelRatio),
        ring: buildPatternSprite('ring', tileSize, pixelRatio),
        dot: buildPatternSprite('dot', tileSize, pixelRatio),
      }
      spriteCss = tileSprites[0].width / pixelRatio
      baseCanvas = document.createElement('canvas')
      baseCanvas.width = canvas.width
      baseCanvas.height = canvas.height
      const baseContext = baseCanvas.getContext('2d')
      if (!baseContext) return

      baseContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      baseContext.clearRect(0, 0, width, height)
      for (let row = 0; row < rows; row += 1) {
        const centerY = row * step + tileSize / 2
        for (let column = 0; column < columns; column += 1) {
          const index = row * columns + column
          const centerX = startX + column * step + tileSize / 2
          const x = centerX - tileSize / 2
          const y = centerY - tileSize / 2
          baseContext.drawImage(
            tileSprites[0],
            centerX - spriteCss / 2,
            centerY - spriteCss / 2,
            spriteCss,
            spriteCss,
          )

          const pattern = patterns[index]
          const kind = pattern < 0.23 ? 'checker' : pattern < 0.3 ? 'ring' : pattern < 0.37 ? 'dot' : null
          if (kind && !patternBlocked[index]) {
            baseContext.globalAlpha = kind === 'checker' ? 0.13 : 0.15
            baseContext.drawImage(patternSprites[kind], x, y, tileSize, tileSize)
            baseContext.globalAlpha = 1
          }
        }
      }

    }

    function draw(now: number) {
      frame = 0
      if (!width || !height || !patternSprites || !baseCanvas) return

      // Time-based easing: same feel at 60Hz, 120Hz, or when frames drop
      const dt = lastTime ? Math.min(now - lastTime, 50) : 16.7
      lastTime = now
      const positionEase = 1 - Math.exp(-dt / 55)
      const strengthEase = 1 - Math.exp(-dt / 80)

      if (snapPointer) {
        pointer.x = pointer.targetX
        pointer.y = pointer.targetY
        snapPointer = false
      }

      pointer.x += (pointer.targetX - pointer.x) * positionEase
      pointer.y += (pointer.targetY - pointer.y) * positionEase
      pointer.strength += (pointer.targetStrength - pointer.strength) * strengthEase

      let settling = false
      if (Math.abs(pointer.targetX - pointer.x) < 0.3 && Math.abs(pointer.targetY - pointer.y) < 0.3) {
        pointer.x = pointer.targetX
        pointer.y = pointer.targetY
      } else {
        settling = true
      }
      if (Math.abs(pointer.targetStrength - pointer.strength) < 0.01) {
        pointer.strength = pointer.targetStrength
      } else {
        settling = true
      }

      for (let index = waves.length - 1; index >= 0; index -= 1) {
        if (now - waves[index].start > WAVE_DURATION) waves.splice(index, 1)
      }

      // Per-wave values are computed once per frame, not once per tile
      const waveStates = waves.map((wave) => {
        const progress = (now - wave.start) / WAVE_DURATION
        return {
          x: wave.x,
          y: wave.y,
          radius: progress * reach,
          pulse: Math.sin(progress * Math.PI) * (1 - progress),
        }
      })

      const ctx = context!
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(baseCanvas, 0, 0, width, height)

      const hoverActive = pointer.strength > 0.004
      const hoverCutoff = tileSize * 4.2 // beyond this the falloff is effectively zero
      const hoverFalloff = tileSize * tileSize * 3.2
      const waveRange = tileSize * 1.35
      const hasWaves = waveStates.length > 0
      // Pointer-only frames need to inspect just the nearby tiles. Waves still
      // inspect the full grid because their fronts travel across the surface.
      const firstRow = hasWaves ? 0 : hoverActive
        ? Math.max(0, Math.floor((pointer.y - hoverCutoff - tileSize / 2) / step)) : rows
      const lastRow = hasWaves ? rows : hoverActive
        ? Math.min(rows, Math.ceil((pointer.y + hoverCutoff - tileSize / 2) / step) + 1) : rows
      const firstColumn = hasWaves ? 0 : hoverActive
        ? Math.max(0, Math.floor((pointer.x - hoverCutoff - startX - tileSize / 2) / step)) : columns
      const lastColumn = hasWaves ? columns : hoverActive
        ? Math.min(columns, Math.ceil((pointer.x + hoverCutoff - startX - tileSize / 2) / step) + 1) : columns
      const activeTiles: {
        index: number
        centerX: number
        centerY: number
        pointerDx: number
        pointerDy: number
        hover: number
        waveLift: number
        tint: number
      }[] = []

      for (let row = firstRow; row < lastRow; row += 1) {
        const centerY = row * step + tileSize / 2

        for (let column = firstColumn; column < lastColumn; column += 1) {
          const centerX = startX + column * step + tileSize / 2

          let hover = 0
          let pointerDx = 0
          let pointerDy = 0
          if (hoverActive) {
            pointerDx = centerX - pointer.x
            pointerDy = centerY - pointer.y
            if (Math.abs(pointerDx) < hoverCutoff && Math.abs(pointerDy) < hoverCutoff) {
              hover = pointer.strength * Math.exp(-(pointerDx * pointerDx + pointerDy * pointerDy) / hoverFalloff)
            }
          }

          let waveLift = 0
          let tint = 0
          for (let w = 0; w < waveStates.length; w += 1) {
            const wave = waveStates[w]
            const waveDx = centerX - wave.x
            const waveDy = centerY - wave.y
            const distanceSquared = waveDx * waveDx + waveDy * waveDy
            const innerRadius = Math.max(0, wave.radius - waveRange)
            const outerRadius = wave.radius + waveRange
            if (distanceSquared < innerRadius * innerRadius || distanceSquared > outerRadius * outerRadius) continue

            // Most tiles are nowhere near the moving wave front. Only take a
            // square root for tiles inside its narrow visible band.
            const distance = Math.sqrt(distanceSquared)
            const front = Math.max(0, 1 - Math.abs(distance - wave.radius) / waveRange)
            if (front > 0) {
              const amount = front * wave.pulse
              waveLift += amount
              if (amount > tint) tint = amount
            }
          }

          if (hover < 0.008 && waveLift < 0.012) continue
          activeTiles.push({ index: row * columns + column, centerX, centerY, pointerDx, pointerDy, hover, waveLift, tint })
        }
      }

      for (const tile of activeTiles) {
        const { index, centerX, centerY, pointerDx, pointerDy, hover, waveLift, tint } = tile
        const lift = Math.min(1, hover * 0.75 + waveLift * 1.15)
        const level = Math.round(lift * LIFT_LEVELS)
        const size = tileSize + lift * 2.5
        const tileX = centerX - size / 2
        const tileY = centerY - size / 2 - lift * 4

        ctx.drawImage(
          getTileSprite(level),
          centerX - spriteCss / 2,
          centerY - spriteCss / 2 - lift * 4,
          spriteCss,
          spriteCss,
        )

        if (tint > 0.015) {
          ctx.beginPath()
          ctx.roundRect(tileX + 1, tileY + 1, size - 2, size - 2, Math.max(0, size * 0.23 - 1))
          ctx.fillStyle = `rgba(174, 202, 220, ${Math.min(0.13, tint * 0.16)})`
          ctx.fill()
        }

        const pattern = patterns[index]
        let kind: PatternKind | null = null
        let alpha = 0
        if (!patternBlocked[index]) {
          if (pattern < 0.23 || waveLift > 0.12) {
            kind = 'checker'
            alpha = Math.min(0.15, (pattern < 0.23 ? 0.04 : 0) + waveLift * 0.2 + hover * 0.06)
          } else if (pattern < 0.3) {
            kind = 'ring'
            alpha = hover * 0.16
          } else if (pattern < 0.37) {
            kind = 'dot'
            alpha = hover * 0.16
          }
        }
        if (kind && alpha > 0) {
          ctx.globalAlpha = alpha
          ctx.drawImage(patternSprites[kind], tileX, tileY, size, size)
          ctx.globalAlpha = 1
        }

        if (hover > 0.04) {
          const radius = size * 0.23
          ctx.beginPath()
          if (Math.abs(pointerDx) >= Math.abs(pointerDy)) {
            const edgeX = pointerDx < 0 ? tileX + radius : tileX + size - radius
            ctx.moveTo(edgeX, tileY + radius * 0.55)
            ctx.lineTo(edgeX, tileY + size - radius * 0.55)
          } else {
            const edgeY = pointerDy < 0 ? tileY + radius : tileY + size - radius
            ctx.moveTo(tileX + radius * 0.55, edgeY)
            ctx.lineTo(tileX + size - radius * 0.55, edgeY)
          }
          const glow = Math.min(0.95, hover * 1.1)
          ctx.lineCap = 'round'
          ctx.lineWidth = 6
          ctx.strokeStyle = `rgba(255, 255, 255, ${glow * 0.3})`
          ctx.stroke()
          ctx.lineWidth = 2
          ctx.strokeStyle = `rgba(255, 255, 255, ${glow})`
          ctx.stroke()
          ctx.lineCap = 'butt'
        }
      }

      if ((waves.length || settling) && canAnimate()) {
        frame = requestAnimationFrame(draw)
      } else {
        lastTime = 0
      }
    }

    const applySize = () => {
      resizeFrame = 0
      const nextWidth = surface.clientWidth
      const nextHeight = surface.clientHeight
      // This canvas is a decorative background and is redrawn during pointer
      // and wave motion. Keep its backing store at CSS resolution to avoid
      // multiplying that work on high-DPI displays.
      const nextRatio = Math.min(window.devicePixelRatio || 1, 1)
      if (nextWidth === width && nextHeight === height && nextRatio === pixelRatio) return

      width = nextWidth
      height = nextHeight
      pixelRatio = nextRatio
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)

      if (width && height) {
        buildLayout()
        if (frame) {
          cancelAnimationFrame(frame)
          frame = 0
        }
        draw(performance.now())
      }
    }

    // Coalesce rapid resize events into at most one rebuild per frame
    const onResize = () => {
      if (!resizeFrame) resizeFrame = requestAnimationFrame(applySize)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (reducedMotion || event.pointerType === 'touch') return
      const bounds = surface.getBoundingClientRect()
      pointer.targetX = event.clientX - bounds.left
      pointer.targetY = event.clientY - bounds.top
      if (!pointerActive && pointer.strength < 0.02) snapPointer = true // no sweep from the corner on entry
      pointerActive = true
      pointer.targetStrength = 1
      schedule()
    }

    const onPointerLeave = () => {
      pointerActive = false
      pointer.targetStrength = 0
      schedule()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (
        reducedMotion
        || (event.target instanceof Element && event.target.closest('a, button, input, select, textarea'))
      ) return
      const bounds = canvas.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      waves.push({
        x: ((event.clientX - bounds.left) / bounds.width) * width,
        y: ((event.clientY - bounds.top) / bounds.height) * height,
        start: performance.now(),
      })
      if (waves.length > 4) waves.shift()
      schedule()
    }

    const onVisibilityChange = () => {
      if (canAnimate()) schedule()
      else if (frame) {
        cancelAnimationFrame(frame)
        frame = 0
        lastTime = 0
      }
    }

    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(surface)
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting
      onVisibilityChange()
    })
    intersectionObserver.observe(surface)
    surface.addEventListener('pointermove', onPointerMove, { passive: true })
    surface.addEventListener('pointerleave', onPointerLeave)
    surface.addEventListener('pointerdown', onPointerDown, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)
    applySize()

    return () => {
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      surface.removeEventListener('pointermove', onPointerMove)
      surface.removeEventListener('pointerleave', onPointerLeave)
      surface.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (frame) cancelAnimationFrame(frame)
      if (resizeFrame) cancelAnimationFrame(resizeFrame)
    }
  }, [reducedMotion])

  return <canvas ref={canvasRef} className="rp-glass-grid" aria-hidden="true" />
}
