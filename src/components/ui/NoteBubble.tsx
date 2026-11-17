import { motion } from 'motion/react'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { springs } from '../../lib/springs'

type Props = { message: string; onDismiss: () => void }

/** Small dark tooltip. Visual only; announce the message through a live region. */
export function NoteBubble({ message, onDismiss }: Props) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      aria-hidden
      onClick={onDismiss}
      className="pointer-events-auto cursor-default rounded-full bg-neutral-900 px-3.5 py-1.5 text-center text-xs text-white shadow-lg"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.96 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={reduced ? { duration: 0.12 } : springs.tactile}
    >
      {message}
    </motion.div>
  )
}
