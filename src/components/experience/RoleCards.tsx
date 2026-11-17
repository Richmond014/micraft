import { useState } from 'react'
import { motion } from 'motion/react'
import { DeferredImage } from '../ui/DeferredImage'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { assets, getResponsiveImageSrcSet } from '../../lib/assets'
import { journey } from '../../lib/data'

const shadow = 'shadow-[0_10px_22px_-10px_rgba(0,0,0,0.35),0_2px_4px_rgba(0,0,0,0.08)]'

const EXPANDED_H = 192
const COLLAPSED_H = 96
const COLLAPSED_Y = 204

// How close (in px) the active card must be to its final position before text appears.
// Lower = text waits longer, higher = text appears earlier.
const REVEAL_HEIGHT_PX = 4
const REVEAL_Y_PX = 8

// Critically damped spring: smooth, no bounce, keeps velocity if interrupted.
const SPRING = { type: 'spring' as const, stiffness: 500, damping: 45, mass: 1 }

export type ExperienceId = 'aws' | 'lamina'

type ExperienceCard = {
  id: ExperienceId
  role: { title: string; company: string; date?: string }
  tone: 'violet' | 'gray'
  image?: string
}

type RoleCardsProps = {
  activeId?: ExperienceId
  onActiveChange?: (nextId: ExperienceId) => void
}

export function RoleCards({ activeId: controlledActiveId, onActiveChange }: RoleCardsProps) {
  const { current, previous } = journey.roles
  const { badge, logo } = assets.experience
  const reduced = useReducedMotion()
  const [internalActiveId, setInternalActiveId] = useState<ExperienceId>('aws')
  // false while cards are moving: all text is hidden until the active card is nearly in place
  const [settled, setSettled] = useState(true)
  const activeId = controlledActiveId ?? internalActiveId

  const setActiveId = (nextId: ExperienceId) => {
    if (nextId === activeId) return
    setSettled(false)
    if (onActiveChange) {
      onActiveChange(nextId)
      return
    }
    setInternalActiveId(nextId)
  }

  const cards: ExperienceCard[] = [
    { id: 'aws', role: current, tone: 'violet', image: badge },
    { id: 'lamina', role: previous, tone: 'gray', image: logo },
  ]

  const move = reduced ? { duration: 0 } : SPRING
  const textIn = reduced ? { duration: 0 } : { duration: 0.14, ease: 'easeOut' as const }
  const textOut = reduced ? { duration: 0 } : { duration: 0.08, ease: 'easeIn' as const }

  return (
    <div className="relative h-[300px] w-full">
      {cards.map((card) => {
        const expanded = card.id === activeId
        const showExpandedText = expanded && (settled || reduced)
        const showCollapsedText = !expanded && (settled || reduced)
        const collapsedTitle = card.id === 'lamina' ? 'UI/UX Designer' : card.role.title

        return (
          <motion.button
            key={card.id}
            type="button"
            aria-label={`${expanded ? 'Selected' : 'Show'} ${card.role.company} experience`}
            aria-pressed={expanded}
            onClick={() => setActiveId(card.id)}
            initial={false}
            animate={{
              height: expanded ? EXPANDED_H : COLLAPSED_H,
              y: expanded ? 0 : COLLAPSED_Y,
              borderRadius: expanded ? 22 : 19,
            }}
            transition={move}
            onUpdate={(latest) => {
              // Reveal text as soon as the active card is close to its final spot
              if (settled || card.id !== activeId) return
              const h = Number(latest.height)
              const y = Number(latest.y)
              if (Number.isNaN(h) || Number.isNaN(y)) return
              if (Math.abs(h - EXPANDED_H) <= REVEAL_HEIGHT_PX && Math.abs(y) <= REVEAL_Y_PX) {
                setSettled(true)
              }
            }}
            onAnimationComplete={(definition) => {
              // Backup: if the animation fully completes, make sure text is shown
              if (
                card.id === activeId &&
                typeof definition === 'object' &&
                definition !== null &&
                'height' in definition
              ) {
                setSettled(true)
              }
            }}
            whileHover={reduced ? undefined : { filter: 'brightness(1.04)' }}
            whileTap={reduced ? undefined : { filter: 'brightness(0.97)' }}
            style={{ zIndex: expanded ? 2 : 1 }}
            className={`absolute inset-x-0 top-0 block w-full cursor-pointer overflow-hidden text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-black ${
              card.tone === 'violet' ? 'bg-[#a35cff]' : 'bg-[#8a8a8a]'
            } ${shadow}`}
          >
            {/* Expanded text: fixed size, visible only when this card is active AND in position */}
            <motion.span
              aria-hidden={!expanded}
              initial={false}
              animate={{ opacity: showExpandedText ? 1 : 0 }}
              transition={showExpandedText ? textIn : textOut}
              style={{ height: EXPANDED_H }}
              className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-start justify-between gap-8 p-6 text-white"
            >
              <span className="block max-w-[55%]">
                <span className="block text-sm font-semibold sm:text-base">{card.role.title}</span>
                <span className="block text-xs opacity-90 sm:text-sm">{card.role.company}</span>
              </span>
              {card.role.date && (
                <span className="w-fit rounded-full bg-white/25 px-3 py-1 text-xs">{card.role.date}</span>
              )}
            </motion.span>

            {/* Collapsed text: fixed size, visible only when this card is inactive AND in position */}
            <motion.span
              aria-hidden={expanded}
              initial={false}
              animate={{ opacity: showCollapsedText ? 1 : 0 }}
              transition={showCollapsedText ? textIn : textOut}
              style={{ height: COLLAPSED_H }}
              className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-4 p-4 text-white/90"
            >
              <span className="ml-auto min-w-0 whitespace-nowrap text-right text-xs leading-tight sm:text-sm">
                <span className="block font-semibold text-white">{collapsedTitle}</span>
                <span className="mt-1 block opacity-80">{card.role.company}</span>
              </span>
            </motion.span>

            {/* Badge/logo: on top as in your original, moves with the card, no blur */}
            {card.image && (
              <motion.span
                aria-hidden
                initial={false}
                animate={{
                  left: expanded ? '56.4%' : '7%',
                  width: expanded ? '39.4%' : '21%',
                  top: expanded ? EXPANDED_H * 0.08 : COLLAPSED_H * 0.05,
                  height: expanded ? EXPANDED_H * 0.84 : COLLAPSED_H * 0.9,
                }}
                transition={move}
                className="pointer-events-none absolute grid place-items-center"
              >
                <DeferredImage
                  src={card.image}
                  srcSet={getResponsiveImageSrcSet(card.image, [400, 800])}
                  sizes="(min-width: 424px) 170px, 40vw"
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
              </motion.span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}