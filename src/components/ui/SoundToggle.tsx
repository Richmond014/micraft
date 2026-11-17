import { Volume2, VolumeX } from 'lucide-react'
import { motion } from 'motion/react'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { useSound } from '../../hooks/useSound'
import { springs } from '../../lib/springs'

/** Global sound switch. Off by default; the choice persists. */
export function SoundToggle() {
  const { enabled, setEnabled, play } = useSound()
  const reduced = useReducedMotion()

  return (
    <motion.button
      type="button"
      aria-pressed={enabled}
      aria-label={enabled ? 'Turn interface sounds off' : 'Turn interface sounds on'}
      onClick={() => {
        setEnabled(!enabled)
        if (!enabled) play('pop')
      }}
      whileHover={reduced ? undefined : { scale: 1.08 }}
      whileTap={reduced ? undefined : { scale: 0.92 }}
      transition={springs.tactile}
      className="fixed right-4 bottom-4 z-40 grid size-10 place-items-center rounded-full bg-black text-white shadow-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-black"
    >
      {enabled ? <Volume2 size={18} aria-hidden /> : <VolumeX size={18} aria-hidden />}
    </motion.button>
  )
}
