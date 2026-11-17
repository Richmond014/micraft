import { motion } from 'motion/react'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { ease } from '../../lib/springs'
import { assets } from '../../lib/assets'

/** The blue pen-tool line with its "m/r" cursor tag. Decorative. */
export function PenPath() {
  const reduced = useReducedMotion()
  return (
    <div aria-hidden className="pointer-events-none absolute top-[55%] left-[-53%] z-0 hidden md:block lg:left-[-38%]">
      <div className="relative h-[214.709px] w-[430.929px] origin-top-left scale-x-[0.9] scale-y-[0.98] lg:scale-100">
        <span className="absolute top-[-24px] left-[55px] grid h-5 w-[82px] place-items-center rounded-[3px] bg-editor-blue text-xs leading-4 text-white shadow-[0_2px_4px_rgba(0,0,0,0.25)]">
          m/r
        </span>
        <img
          src={assets.hero.penCursor}
          alt=""
          width={23.1512}
          height={23.1512}
          className="absolute top-[-1px] left-[25px] block max-w-none"
        />
        <motion.img
          src={assets.hero.penPath}
          alt=""
          width={430.929}
          height={214.709}
          initial={reduced ? false : { clipPath: 'inset(0 100% 0 0)' }}
          whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
          viewport={{ once: true }}
          transition={{ duration: 1.8, ease: ease.smooth, delay: 0.4 }}
          className="absolute top-[21px] left-0 block max-w-none"
        />
      </div>
    </div>
  )
}
