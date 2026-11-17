import { useEffect, useRef, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, X } from 'lucide-react'
import type { ProjectNotebook } from '../../lib/projectNotebooks'
import { usePageNavigation, type CurtainPalette } from '../../lib/PageNavigationContext'
import './ProjectNotebookDialog.css'

type Props = {
  project: ProjectNotebook
  onClose: () => void
  returnFocusRef: RefObject<HTMLElement | null>
}

const archiveAsset = '/assets/figma/archive/'

function getProjectCurtainPalette(button: HTMLButtonElement): CurtainPalette | undefined {
  const themeRoot = button.closest<HTMLElement>('[data-project-theme]')
  if (!themeRoot) {
    console.error('Unable to find the project theme for its curtain transition.')
    return undefined
  }

  const styles = getComputedStyle(themeRoot)
  const palette = [
    styles.getPropertyValue('--project-action-fill').trim(),
    styles.getPropertyValue('--project-primary').trim(),
  ]

  if (!palette[0] || !palette[1]) {
    console.error(`Curtain color tokens are missing for project theme "${themeRoot.dataset.projectTheme}".`)
    return undefined
  }

  return palette
}

export function ProjectNotebookDialog({ project, onClose, returnFocusRef }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const { navigate, prefetch } = usePageNavigation()

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const focusTarget = returnFocusRef.current
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      focusTarget?.focus()
    }
  }, [onClose, returnFocusRef])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#d6d6d6]/95 p-4 sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-detail-title"
        data-project-theme={project.theme}
        className="project-notebook-dialog relative my-auto grid w-full max-w-[720px] grid-cols-1 gap-2 md:aspect-[1143/831] md:block"
      >
        <img
          src={`${archiveAsset}${project.spread}`}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 hidden size-full object-fill md:block [clip-path:inset(1.5%_1.5%_1.5%_1.5%_round_24px)]"
        />
        <div className="relative aspect-[519/757] overflow-hidden rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] md:absolute md:left-[3.06%] md:top-[4.33%] md:aspect-auto md:h-[91.1%] md:w-[45.4%] md:rounded-[30px] md:shadow-none">
          <img
            src={`${archiveAsset}${project.artwork}`}
            alt={`${project.title} project artwork`}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        </div>
        <div className="relative min-h-[340px] rounded-[24px] bg-[#f7f7f7] px-6 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.12)] md:absolute md:left-[50.6%] md:top-[4.33%] md:h-[91.1%] md:min-h-0 md:w-[45.4%] md:overflow-hidden md:rounded-[30px] md:px-0 md:py-0 md:shadow-none">
          <div className="flex flex-col md:absolute md:inset-x-[6%] md:top-[11.5%] md:h-[51.5%]">
            <div className="flex items-start gap-3 md:gap-[2%]">
              <img
                src={`${archiveAsset}${project.logo}`}
                alt=""
                aria-hidden="true"
                className="h-12 w-12 shrink-0 object-contain md:h-auto md:w-[13%]"
              />
              <div className="min-w-0">
                <h2 id="project-detail-title" className="text-base font-semibold leading-tight tracking-tight text-neutral-950 md:text-[clamp(11px,1.35vw,17px)]">
                  {project.title}
                </h2>
                <p className="mt-1 text-xs text-neutral-700 md:text-[clamp(9px,1.1vw,13px)]">
                  {project.detailDate}
                </p>
              </div>
            </div>
            <p className="mt-6 text-xs leading-[1.5] text-neutral-800 md:mb-[clamp(12px,1.6vw,20px)] md:mt-[3%] md:text-[clamp(9px,1.15vw,13px)] md:leading-[1.35]">
              {project.description}
            </p>
            <div className="mt-7 md:mt-auto">
              <p className="text-left text-xs text-neutral-900 md:text-[clamp(9px,1.15vw,13px)]">
                <strong>Role:</strong> {project.role}
              </p>
              <div className="mt-2 flex w-fit flex-wrap items-center justify-start gap-2 self-start">
                <button
                  type="button"
                  onPointerEnter={() => prefetch(project.destination.hash)}
                  onFocus={() => prefetch(project.destination.hash)}
                  onClick={(event) => {
                    prefetch(project.destination.hash)
                    sessionStorage.setItem(project.destination.returnKey, JSON.stringify({
                      hash: window.location.hash || '#home',
                      scrollY: window.scrollY,
                    }))
                    navigate(project.destination.hash, getProjectCurtainPalette(event.currentTarget))
                  }}
                  className="project-notebook-action project-notebook-action--primary inline-flex min-h-8 w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium md:text-[clamp(9px,1.05vw,12px)]"
                >
                  {project.destination.actionLabel}
                  <ArrowUpRight aria-hidden="true" size={12} />
                </button>
                {project.destination.liveUrl && (
                  <a
                    href={project.destination.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="project-notebook-action project-notebook-action--secondary inline-flex min-h-8 w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium md:text-[clamp(9px,1.05vw,12px)]"
                  >
                    Live Server
                    <ArrowUpRight aria-hidden="true" size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close project details"
          className="project-notebook-close absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_2px_5px_rgba(0,0,0,0.14)] transition-[background,border-color,box-shadow,color,transform] duration-200 md:right-[6.5%] md:top-[7%]"
        >
          <X aria-hidden="true" size={16} strokeWidth={2.5} />
        </button>
      </section>
    </div>,
    document.body,
  )
}
