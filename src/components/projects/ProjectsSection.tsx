import { useCallback, useRef, useState } from 'react'
import { ProjectFolder } from './ProjectFolder'
import { ProjectNotebookDialog } from './ProjectNotebookDialog'
import type { ProjectId } from '../../lib/assets'
import { projects } from '../../lib/data'
import { featuredProjectNotebooks } from '../../lib/projectNotebooks'
import { rememberHomeScrollPosition } from '../../lib/scroll'
import { usePageNavigation } from '../../lib/PageNavigationContext'

export function ProjectsSection() {
  const navigateToHash = usePageNavigation()
  const [selectedNotebook, setSelectedNotebook] = useState<ProjectId | null>(null)
  const notebookTriggerRef = useRef<HTMLButtonElement | null>(null)
  const closeNotebook = useCallback(() => setSelectedNotebook(null), [])

  const openNotebook = (id: ProjectId, trigger: HTMLButtonElement) => {
    notebookTriggerRef.current = trigger
    setSelectedNotebook(id)
  }

  const handleSeeAll = () => {
    rememberHomeScrollPosition()
    navigateToHash('#works')
  }

  return (
    <section id="projects" className="mx-auto mt-12 w-full max-w-[1280px] px-6 pt-20 pb-12 sm:px-10 lg:px-[6%]">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[clamp(1.5rem,2.6vw,2.25rem)] leading-tight font-bold">Featured Projects</h2>
          <p className="mt-1 text-[clamp(0.8rem,1vw,1rem)]">Made through trial, error, and persistence.</p>
        </div>
        <button
          type="button"
          onClick={handleSeeAll}
          className="inline-flex h-10 items-center rounded-full border border-[#c7c7cc] bg-gradient-to-b from-white to-[#f0f0f3] px-5 text-sm font-medium text-[#1d1d1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_2px_rgba(0,0,0,0.08)] transition-[background,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-px hover:border-[#aaaab0] hover:to-[#e8e8ed] hover:shadow-[inset_0_1px_0_#fff,0_4px_10px_rgba(0,0,0,0.12)] active:translate-y-0 active:scale-[0.98] active:shadow-inner focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#007aff]"
        >
          See All
        </button>
      </header>

      <div className="mt-10 grid gap-12 md:grid-cols-3 md:gap-8">
        {projects.map((project) => (
          <ProjectFolder
            key={project.id}
            project={project}
            onOpenNotebook={openNotebook}
          />
        ))}
      </div>
      {selectedNotebook && (
        <ProjectNotebookDialog
          project={featuredProjectNotebooks[selectedNotebook]}
          onClose={closeNotebook}
          returnFocusRef={notebookTriggerRef}
        />
      )}
    </section>
  )
}
