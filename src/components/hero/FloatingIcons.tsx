import { AnimatePresence, motion } from 'motion/react'
import { NoteBubble } from '../ui/NoteBubble'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { useSound } from '../../hooks/useSound'
import { useTransientNote } from '../../hooks/useTransientNote'
import { assets } from '../../lib/assets'
import { heroIcons, type HeroIcon } from '../../lib/data'
import { springs } from '../../lib/springs'

function FloatingIcon({ icon, src, index }: { icon: HeroIcon; src: string; index: number }) {
  const reduced = useReducedMotion()
  const { play } = useSound()
  const { note, show, dismiss } = useTransientNote<string>(2200)
  const hasLogoTile = icon.id !== 'palette'

  return (
    <div className="absolute" style={{ left: icon.left, top: icon.top, width: icon.size }}>
      {/* Outer layer floats, inner layer handles hover so the two transforms never fight. */}
      <motion.div
        animate={reduced ? undefined : { y: [0, -5, 0] }}
        transition={{ duration: 4 + index * 0.7, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
      >
        <motion.button
          type="button"
          aria-label={icon.label}
          onClick={() => {
            play('pop')
            if (icon.message) show(icon.message)
          }}
          initial={{ rotate: icon.rotate }}
          whileHover={reduced ? undefined : { rotate: icon.rotate + 6, scale: 1.1, y: -3 }}
          whileTap={reduced ? undefined : { scale: 0.94 }}
          transition={springs.tactile}
          className={`block w-full outline-offset-2 focus-visible:outline-2 focus-visible:outline-black ${hasLogoTile ? 'overflow-hidden rounded-[10px] shadow-[0_10px_4px_0_rgba(0,0,0,0.25)]' : ''}`}
        >
          <img src={src} alt="" draggable={false} className="block h-auto w-full" />
        </motion.button>
      </motion.div>

      <div role="status" aria-live="polite" className="sr-only">{note?.value}</div>
      <div className="pointer-events-none absolute top-full left-1/2 z-10 mt-2 w-max max-w-[14rem] -translate-x-1/2">
        <AnimatePresence mode="wait">
          {note && <NoteBubble key={note.n} message={note.value} onDismiss={dismiss} />}
        </AnimatePresence>
      </div>
    </div>
  )
}

/** Renders only the icons whose image has been supplied. */
export function FloatingIcons() {
  return heroIcons.map((icon, index) => {
    const src = assets.hero.icons[icon.id]
    return src ? <FloatingIcon key={icon.id} icon={icon} src={src} index={index} /> : null
  })
}
