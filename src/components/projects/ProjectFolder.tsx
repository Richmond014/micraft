import { useState } from 'react'
import { motion } from 'motion/react'
import { FolderGraphic } from './FolderGraphic'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { assets, type ProjectId } from '../../lib/assets'
import type { Project } from '../../lib/data'
import { isFocusVisible } from '../../lib/dom'
import { springs } from '../../lib/springs'

type Props = {
  project: Project
  onOpenNotebook: (id: ProjectId, trigger: HTMLButtonElement) => void
}

export function ProjectFolder({ project, onOpenNotebook }: Props) {
  const reduced = useReducedMotion()
  const [over, setOver] = useState(false)
  const [focused, setFocused] = useState(false)
  const active = over || focused
  const previews = assets.projects[project.id]?.previews ?? []
  const detailsId = `${project.id}-details`

  return (
    <article
      className="flex flex-col items-center"
      onPointerEnter={(e) => { if (e.pointerType !== 'touch') setOver(true) }}
      onPointerLeave={(e) => { if (e.pointerType !== 'touch') setOver(false) }}
      onFocus={(e) => setFocused(isFocusVisible(e.target))}
      onBlur={() => setFocused(false)}
    >
      <button
        type="button"
        aria-expanded={active}
        aria-controls={detailsId}
        aria-label={project.title}
        onClick={(e) => {
          if (project.href) return void window.location.assign(project.href)
          onOpenNotebook(project.id, e.currentTarget)
        }}
        className="w-full rounded-3xl pt-10 outline-offset-4 focus-visible:outline-2 focus-visible:outline-black"
      >
        <FolderGraphic
          previews={previews}
          active={active}
          reduced={reduced}
          title={project.title}
          date={project.date}
        />
      </button>

      <h3 className="mt-6 text-center text-[clamp(1.4rem,2.6vw,2.1rem)] leading-tight font-semibold">
        {project.title}
      </h3>

      {/* Space is reserved so revealing never shifts the layout. */}
      <motion.div
        id={detailsId}
        className="mt-3 min-h-36 w-full max-w-[19rem] text-sm leading-snug font-light text-neutral-500 sm:text-base"
        initial={false}
        animate={{ opacity: active ? 1 : 0, y: active || reduced ? 0 : 8 }}
        transition={reduced ? { duration: 0.12 } : springs.soft}
      >
        <p>{project.description}</p>
        <p className="mt-2 text-neutral-500">
          Role - <strong className="font-bold text-neutral-900">{project.role}</strong>
        </p>
      </motion.div>
    </article>
  )
}
