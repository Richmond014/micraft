import { useRef, useState } from 'react'
import { useMotionValue } from 'motion/react'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { useMarkerSounds } from '../../hooks/useMarkerSounds'
import { useSound } from '../../hooks/useSound'
import { makingProcess } from '../../lib/data'

const markers = Array.from({ length: makingProcess.steps.length + 1 }, (_, index) => index)

export function MakingProcess() {
  const reduced = useReducedMotion()
  const { enabled } = useSound()
  const progress = useMotionValue(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const [activeMarker, setActiveMarker] = useState(0)

  useMarkerSounds(progress, enabled, reduced, markers.length - 1)

  const selectMarker = (marker: number) => {
    const next = Math.max(0, Math.min(markers.length - 1, marker))
    setActiveMarker(next)
    progress.set(next / (markers.length - 1))
  }

  const selectFromPointer = (clientX: number) => {
    const bounds = trackRef.current?.getBoundingClientRect()
    if (!bounds || bounds.width === 0) return
    const ratio = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width))
    selectMarker(Math.round(ratio * (markers.length - 1)))
  }

  return (
    <section
      id="making-process"
      aria-labelledby="making-process-title"
      className="mx-auto w-full max-w-[1280px] px-6 py-20 sm:px-10 lg:px-[6%]"
    >
      <div>
        <h2 id="making-process-title" className="mb-10 text-left text-[clamp(1.7rem,3vw,3rem)] leading-tight font-italic-serif italic">
          {makingProcess.title}
        </h2>

        <div
          ref={trackRef}
          role="slider"
          aria-label="Making process timeline"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={markers.length - 1}
          aria-valuenow={activeMarker}
          aria-valuetext={`${activeMarker}: ${makingProcess.steps[Math.min(activeMarker, makingProcess.steps.length - 1)]}`}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowUp') selectMarker(activeMarker + 1)
            else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') selectMarker(activeMarker - 1)
            else if (event.key === 'Home') selectMarker(0)
            else if (event.key === 'End') selectMarker(markers.length - 1)
            else return
            event.preventDefault()
          }}
          onPointerDown={(event) => {
            if (event.button !== 0) return
            dragging.current = true
            event.currentTarget.setPointerCapture(event.pointerId)
            selectFromPointer(event.clientX)
          }}
          onPointerMove={(event) => {
            if (dragging.current) selectFromPointer(event.clientX)
          }}
          onPointerUp={(event) => {
            dragging.current = false
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId)
            }
          }}
          onPointerCancel={() => { dragging.current = false }}
          className="relative mx-auto h-36 w-full max-w-[1040px] touch-pan-y cursor-grab select-none rounded-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-black active:cursor-grabbing lg:h-[360px]"
        >
          <span aria-hidden className="absolute inset-x-0 top-3 h-px bg-neutral-300" />
          <span
            aria-hidden
            className="absolute top-4 bottom-0 z-0 w-px bg-neutral-900"
            style={{ left: `${(activeMarker / (markers.length - 1)) * 100}%` }}
          />
          <span
            aria-hidden
            className="absolute top-0 z-10 flex size-6 -translate-x-1/2 cursor-grab items-center justify-center rounded-sm bg-editor-blue shadow-sm after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-x-[6px] after:border-t-[6px] after:border-x-transparent after:border-t-editor-blue after:content-[''] active:cursor-grabbing"
            style={{ left: `${(activeMarker / (markers.length - 1)) * 100}%` }}
          >
            <span className="size-1.5 rounded-full bg-white" />
          </span>
          <ol aria-hidden className="absolute inset-x-0 top-1 m-0 h-0 list-none p-0">
              {markers.map((marker) => (
                <li
                  key={marker}
                  className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-2 text-sm"
                  style={{ left: `${(marker / (markers.length - 1)) * 100}%` }}
                >
                  <span className={`h-3 w-px ${marker === activeMarker ? 'bg-editor-blue' : 'bg-neutral-500'}`} />
                  <span className="min-w-[14px] text-center leading-none text-neutral-700">{marker}</span>
                </li>
              ))}
          </ol>

          <ol aria-hidden className="absolute inset-x-0 top-10 m-0 hidden list-none p-0 lg:block">
              {makingProcess.steps.map((step, marker) => (
                <li
                  key={marker}
                  className={`absolute w-max whitespace-nowrap rounded-md border px-1.5 py-1.5 text-[10px] leading-none font-medium shadow-sm transition-colors duration-200 ${
                    marker === activeMarker
                      ? 'border-editor-blue/25 bg-blue-50 text-neutral-900 shadow-md'
                      : 'border-neutral-200 bg-white text-neutral-700'
                  }`}
                  style={{
                    left: `${(marker / (markers.length - 1)) * 100}%`,
                    top: `${marker * 36}px`,
                  }}
                >
                  {step}
                </li>
              ))}
          </ol>

          <p aria-hidden className="absolute inset-x-4 top-16 flex justify-center lg:hidden">
            <span className="max-w-full rounded-md border border-editor-blue/20 bg-white px-3 py-1.5 text-center text-xs leading-tight font-medium text-neutral-800 shadow-sm">
              {makingProcess.steps[Math.min(activeMarker, makingProcess.steps.length - 1)]}
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}