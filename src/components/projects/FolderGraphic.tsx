import { motion } from 'motion/react'
import { DeferredImage } from '../ui/DeferredImage'

type Props = {
  previews: string[]
  active: boolean
  reduced: boolean
  title: string
  date: string
}

const cards = [
  { restingLeft: '49.66%', restingTop: '19.3%', restingRotate: -6, openLeft: '42.95%', openTop: '-13%', openRotate: -5 },
  { restingLeft: '49.66%', restingTop: '20%', restingRotate: 3, openLeft: '59.73%', openTop: '-6%', openRotate: 14 },
  { restingLeft: '49.66%', restingTop: '20.7%', restingRotate: -3, openLeft: '42.28%', openTop: '4%', openRotate: 10 },
]

const folderSpring = { type: 'spring' as const, stiffness: 300, damping: 28, mass: 0.9 }

export function FolderGraphic({ previews, active, reduced, title, date }: Props) {
  const visiblePreviews = previews.slice(0, cards.length)
  const motionTransition = reduced ? { duration: 0 } : folderSpring
  const lifted = active && !reduced

  return (
    <motion.div
      aria-hidden="true"
      className="relative mx-auto aspect-[149/158] w-[78%] max-w-[260px]"
      animate={{ y: lifted ? -3 : 0 }}
      transition={motionTransition}
    >
      <div
        className="absolute inset-0 rounded-[5px] border border-[#8aa2bc]/45"
        style={{
          background: 'radial-gradient(ellipse at 18% 8%,rgba(255,255,255,0.5),transparent 42%),linear-gradient(145deg,#59b7ff 0%,#4169ed 46%,#172b88 100%)',
          borderColor: 'rgba(226,242,255,0.82)',
          boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.38), inset 0 -6px 12px rgba(5,15,70,0.28), 0 12px 26px rgba(28,61,164,0.24)',
        }}
      />

      {visiblePreviews.map((src, index) => {
        const card = cards[index]
        return (
          <motion.div
            key={src}
            initial={false}
            animate={{
              left: active ? card.openLeft : card.restingLeft,
              top: active ? card.openTop : card.restingTop,
              rotate: active ? card.openRotate : card.restingRotate,
            }}
            transition={motionTransition}
            style={{
              position: 'absolute',
              width: '85.2%',
              height: '75.3%',
              x: '-50%',
              zIndex: index + 1,
            }}
            className="overflow-hidden rounded-[5px] bg-white shadow-[0_6px_16px_rgba(0,0,0,0.24)]"
          >
            <DeferredImage src={src} alt="" draggable={false} className="size-full object-cover" />
          </motion.div>
        )
      })}

      <motion.div
        className="absolute inset-x-0 bottom-0 z-[5] h-[69.6%] overflow-hidden rounded-[5px] border border-white/35"
        initial={false}
        animate={{ rotateX: active ? -43 : 0 }}
        transition={motionTransition}
        style={{
          transformPerspective: 1200,
          transformOrigin: '50% 100%',
          backdropFilter: 'blur(7px)',
          WebkitBackdropFilter: 'blur(7px)',
          background: 'linear-gradient(180deg,rgba(226,244,255,0.58) 0%,rgba(79,112,194,0.6) 54%,rgba(20,34,91,0.78) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.46), inset 0 -1px 0 rgba(7,21,79,0.24), 0 4px 10px rgba(9,24,83,0.2)',
        }}
      >
        <div className="absolute bottom-[7px] left-[5px] right-[5px] flex flex-col gap-px text-left text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          <span className="truncate text-[12px] font-light leading-tight">{title}</span>
          <span className="truncate text-[9px] font-extralight leading-tight opacity-85">{date}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
