import type { Transition } from 'motion/react'

export const springs = {
  tactile: { type: 'spring', stiffness: 420, damping: 30, mass: 0.8 },
  soft: { type: 'spring', stiffness: 220, damping: 26, mass: 1 },
  wobble: { type: 'spring', stiffness: 300, damping: 14, mass: 0.7 },
} as const satisfies Record<string, Transition>

export const ease = { smooth: [0.22, 1, 0.36, 1] } as const