import { Hash, MessageSquare, Move, MousePointer2, Pencil, PenTool, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { NoteBubble } from '../ui/NoteBubble'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { useSound } from '../../hooks/useSound'
import { useTransientNote } from '../../hooks/useTransientNote'
import { tools, type ToolId } from '../../lib/data'
import { springs } from '../../lib/springs'

const icons: Record<ToolId, LucideIcon> = {
  cursor: MousePointer2,
  move: Move,
  frame: Hash,
  pen: PenTool,
  pencil: Pencil,
  comment: MessageSquare,
  text: Type,
}

export function Toolbar() {
  const reduced = useReducedMotion()
  const { play } = useSound()
  const { note, show, dismiss } = useTransientNote<ToolId>()
  const message = note ? tools.find((t) => t.id === note.value)?.message : undefined

  return (
    <div className="relative inline-flex">
      <div role="toolbar" aria-label="Design tools" className="inline-flex gap-[22px] rounded-[14px] bg-toolbar px-2.5 py-2 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.45)]">
        {tools.map(({ id, label }) => {
          const Icon = icons[id]
          const active = note?.value === id
          return (
            <motion.button
              key={id}
              type="button"
              aria-label={label}
              aria-pressed={active}
              onClick={() => { play('tick'); show(id) }}
              whileHover={reduced ? undefined : { y: -1, scale: 1.12 }}
              whileTap={reduced ? undefined : { scale: 0.9 }}
              transition={springs.tactile}
              className={`grid size-9 place-items-center rounded-[10px] text-white outline-offset-1 transition-colors focus-visible:outline-2 focus-visible:outline-white sm:size-10 ${active ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              <Icon size={22} aria-hidden />
            </motion.button>
          )
        })}
      </div>

      {/* Screen readers get the message here; the bubble below is visual only. */}
      <div role="status" aria-live="polite" className="sr-only">{message}</div>

      <div className="pointer-events-none absolute top-full left-1/2 z-10 mt-3 w-max max-w-[16rem] -translate-x-1/2">
        <AnimatePresence mode="wait">
          {note && message && <NoteBubble key={note.n} message={message} onDismiss={dismiss} />}
        </AnimatePresence>
      </div>
    </div>
  )
}
