import { motion } from 'motion/react'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { useIdTilt } from '../../hooks/useIdTilt'
import { assets } from '../../lib/assets'
import { about } from '../../lib/data'
import { springs } from '../../lib/springs'

const SHADOW_REST = '0 10px 20px -10px rgba(0,0,0,0.30), 0 2px 4px rgba(0,0,0,0.08)'
const SHADOW_LIFT = '0 22px 34px -12px rgba(0,0,0,0.38), 0 4px 8px rgba(0,0,0,0.10)'

export function IdCard() {
  const reduced = useReducedMotion()
  const { tilt, handlers } = useIdTilt(reduced)
  const { photo } = assets.about

  return (
    <motion.figure
      {...handlers}
      initial={false}
      animate={{ rotate: tilt, y: tilt ? -6 : 0, scale: tilt ? 1.02 : 1, boxShadow: tilt ? SHADOW_LIFT : SHADOW_REST }}
      transition={{ rotate: springs.wobble, y: springs.soft, scale: springs.soft, boxShadow: { duration: 0.3 } }}
      // Pivot near the clip so it swings like a hanging badge.
      style={{ transformOrigin: '50% 6%' }}
      className="m-0 w-full max-w-[20rem] rounded-[1.7rem] border border-white/30 bg-gradient-to-br from-[#707075] via-[#55555a] to-[#3a3a3c] p-[5.5%] text-white select-none"
    >
      <div aria-hidden className="mx-auto mb-[6%] h-3.5 w-[34%] rounded-full border border-white/90 bg-gradient-to-b from-white to-[#e7ebf1] shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]" />
      <div className="aspect-[519/676] overflow-hidden rounded-[1.3rem] border-[3px] border-white/90 bg-white shadow-[0_5px_14px_rgba(31,41,55,0.12)]">
        {photo && (
          <img src={photo} alt="Portrait of Michael Richmond Racelis" draggable={false} className="size-full scale-[1.025] object-cover" />
        )}
      </div>
      <figcaption className="mt-3 px-1">
        <p className="text-sm font-semibold sm:text-base">{about.card.name}</p>
        <p className="text-xs text-white/75 sm:text-sm">{about.card.network}</p>
      </figcaption>
    </motion.figure>
  )
}
