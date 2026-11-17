import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'

export const TILT_MIN = 2
export const TILT_MAX = 4.5

/** Alternate direction each time and vary the size, so no two reactions feel identical. */
export function nextTilt(lastSign: 1 | -1, random: number) {
  const sign: 1 | -1 = lastSign === 1 ? -1 : 1
  return { sign, deg: sign * (TILT_MIN + random * (TILT_MAX - TILT_MIN)) }
}

/** Hover (mouse/pen) holds a tilt until the pointer leaves; a touch tap tilts briefly. */
export function useIdTilt(reduced: boolean) {
  const [tilt, setTilt] = useState(0)
  const last = useRef<1 | -1>(1)
  const timer = useRef<number | undefined>(undefined)

  const engage = useCallback(() => {
    if (reduced) return
    const n = nextTilt(last.current, Math.random())
    last.current = n.sign
    setTilt(n.deg)
  }, [reduced])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const handlers = {
    onPointerEnter: (e: PointerEvent) => { if (e.pointerType !== 'touch') engage() },
    onPointerLeave: (e: PointerEvent) => { if (e.pointerType !== 'touch') setTilt(0) },
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      engage()
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setTilt(0), 900)
    },
  }
  return { tilt, handlers }
}
