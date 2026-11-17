import { useRef } from 'react'
import { useMotionValueEvent, type MotionValue } from 'motion/react'
import { playSound } from '../lib/audio'

export function useMarkerSounds(progress: MotionValue<number>, enabled: boolean, reduced: boolean, lastMarker: number) {
  const previousMarker = useRef<number | null>(null)

  useMotionValueEvent(progress, 'change', (value) => {
    const marker = Math.round(Math.max(0, Math.min(1, value)) * lastMarker)
    const previous = previousMarker.current
    previousMarker.current = marker

    if (previous === null || marker === previous || !enabled || reduced) return

    playSound('tick')
  })
}