import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { SoundToggle } from '../ui/SoundToggle'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { projectScrollReturnKeys, scrollToTarget } from '../../lib/scroll'
import {
  awsCloudClubWebsiteNotebook,
  awsSkillBuilderNotebook,
  featuredProjectNotebooks,
  type ProjectNotebook,
} from '../../lib/projectNotebooks'
import { ProjectNotebookDialog } from './ProjectNotebookDialog'
import { DraggableRulerFilter } from './DraggableRulerFilter'
import { WorkPhotoSphere } from './WorkPhotoSphere'

const archiveAsset = '/assets/figma/archive/'
const filters = ['All', '2026', '2025', 'Web', 'Mobile']
const FILTER_POSITION_OFFSET = 32
const BACK_BUTTON_SCROLL_HOLD = 1800

type ArchiveCard = ProjectNotebook & {
  date: string
  year: string
  medium: 'Web' | 'Mobile'
  image?: string
  kind?: 'loop' | 'ease' | 'spotify'
}

const archiveCards: ArchiveCard[] = [
  { ...featuredProjectNotebooks.loop, date: 'Aug 2026', year: '2026', medium: 'Mobile', kind: 'loop' },
  { ...awsSkillBuilderNotebook, date: 'Feb 2026', year: '2026', medium: 'Web', image: 'aws-skill-builder.png' },
  { ...featuredProjectNotebooks.bantay, date: 'Dec 2025', year: '2025', medium: 'Web', image: 'bantay.png' },
  { theme: 'ease-service', title: 'EaseService', date: 'Jan 2026', year: '2026', medium: 'Mobile', kind: 'ease', artwork: 'figma-artwork-06.png', spread: 'figma-book-06.png', logo: 'figma-logo-06.png', detailDate: 'Jan 2026', description: 'EaseService is a service-finding platform that connects users with nearby skilled professionals for their everyday needs. It makes discovering, browsing, and accessing local services simpler and more convenient.', role: 'UI/UX Designer', destination: { hash: '#ease-contributions', returnKey: 'ease-contributions-return', actionLabel: 'View Contribution' } },
  { theme: 'spotify', title: 'Spotify Redesign', date: 'Sep 2026', year: '2026', medium: 'Mobile', kind: 'spotify', artwork: 'figma-artwork-07.png', spread: 'figma-book-07.png', logo: 'figma-logo-07.png', detailDate: 'September 2026', description: 'The Spotify redesign reimagines the music streaming experience with a focus on intuitive navigation, personalized content, and a more engaging interface. It aims to make discovering music, exploring playlists, and enjoying favorite tracks feel seamless and enjoyable.', role: 'UI/UX Designer', destination: { hash: '#spotify-contributions', returnKey: 'spot-contributions-return', actionLabel: 'View Contribution' } },
  { theme: 'hanapbuhay', title: 'Hanapbuhay', date: 'Jan 2026', year: '2026', medium: 'Web', image: 'hanapbuhay.png', artwork: 'figma-artwork-05.png', spread: 'figma-book-05.png', logo: 'figma-logo-05.png', detailDate: 'August 2026', description: 'HanapBuhay is a job-seeking platform designed to make finding employment opportunities more accessible and straightforward. It provides a simple experience for users to explore job openings and connect with potential employers.', role: 'UI/UX Designer', destination: { hash: '#hanap-contributions', returnKey: 'hanap-contributions-return', actionLabel: 'View Contribution' } },
  { ...awsCloudClubWebsiteNotebook, date: 'Sep 2025', year: '2025', medium: 'Web', image: 'cloud-club-website.png' },
  { theme: 'aws-official', title: 'AWS Cloud Club Official PUP Website', date: 'Feb 2026', year: '2026', medium: 'Web', image: 'cloud-club-official.png', artwork: 'figma-artwork-08.png', spread: 'figma-book-08.png', logo: 'figma-logo-08.png', detailDate: 'Feb 2026', description: "The official AWS Cloud Club PUP website serves as the club's digital space for sharing its mission, activities, events, and opportunities. It helps students stay informed, explore the community, and connect with fellow technology enthusiasts.", role: 'UI/UX Designer', destination: { hash: '#awsoff-contributions', returnKey: 'awsoff-contributions-return', actionLabel: 'View Contribution', liveUrl: 'https://www.awsccpup.cloud' } },
]

function Preview({ card }: { card: ArchiveCard }) {
  if (card.kind === 'loop') {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-[50px] bg-[#f5f5f5]">
        <img src={`${archiveAsset}loop-background.png`} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        <img src={`${archiveAsset}loop-phone-left.png`} alt="" loading="lazy" decoding="async" className="absolute left-[8.2%] top-[7.7%] h-[84.3%] w-[37.2%] rounded-[10px] object-cover" />
        <img src={`${archiveAsset}loop-phone-right.png`} alt="" loading="lazy" decoding="async" className="absolute left-[54.7%] top-[7.7%] h-[84.3%] w-[37.2%] rounded-[10px] object-cover" />
      </div>
    )
  }

  if (card.kind === 'ease') {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-[50px]">
        <img src={`${archiveAsset}ease-service-background.png`} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full rotate-180 object-cover" />
        <img src={`${archiveAsset}ease-service-splash.png`} alt="" loading="lazy" decoding="async" className="absolute left-[6.8%] top-[8.4%] h-[84.5%] w-[37.2%] rounded-[10px] object-cover" />
        <img src={`${archiveAsset}ease-service-home.png`} alt="" loading="lazy" decoding="async" className="absolute left-[54.6%] top-[8.4%] h-[84.5%] w-[34.6%] rounded-[10px] object-cover" />
      </div>
    )
  }

  if (card.kind === 'spotify') {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-[50px]">
        <img src={`${archiveAsset}spotify-background.png`} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        <img src={`${archiveAsset}spotify-screen-left.png`} alt="" loading="lazy" decoding="async" className="absolute left-[15%] top-[7.7%] h-[84.3%] w-[29.8%] rounded-[10px] object-cover" />
        <img src={`${archiveAsset}spotify-screen-right.png`} alt="" loading="lazy" decoding="async" className="absolute right-[17.4%] top-[7.7%] h-[84.3%] w-[29.8%] rounded-[10px] object-cover" />
      </div>
    )
  }

  return (
    <img
      src={`${archiveAsset}${card.image ?? ''}`}
      alt={`${card.title} project preview`}
      loading="lazy"
      decoding="async"
      className="h-full w-full rounded-[50px] object-cover"
    />
  )
}

export function WorksArchivePage() {
  const reducedMotion = useReducedMotion()
  const [activeFilter, setActiveFilter] = useState('All')
  const [floatingScrollRequest, setFloatingScrollRequest] = useState(0)
  const [showBackButton, setShowBackButton] = useState(() => window.scrollY <= 120)
  const [backButtonAtTop, setBackButtonAtTop] = useState(() => window.scrollY <= 120)
  const [selectedProject, setSelectedProject] = useState<ArchiveCard | null>(null)
  const hasPendingProjectReturn = useRef(
    projectScrollReturnKeys.some((key) => sessionStorage.getItem(key) !== null),
  )
  const triggerRef = useRef<HTMLButtonElement>(null)
  const filterSectionRef = useRef<HTMLDivElement>(null)
  const visibleCards = archiveCards.filter((card) => {
    if (activeFilter === 'All') return true
    return card.year === activeFilter || card.medium === activeFilter
  })
  const changeFilter = (filter: string, fromFloating?: boolean) => {
    setActiveFilter(filter)
    if (fromFloating) setFloatingScrollRequest((request) => request + 1)
  }
  const closeProject = useCallback(() => setSelectedProject(null), [])

  useLayoutEffect(() => {
    if (hasPendingProjectReturn.current) return

    const resetToArchiveTop = () => {
      scrollToTarget(0, { behavior: 'instant' })
      window.scrollTo(0, 0)
    }

    resetToArchiveTop()
    const frame = requestAnimationFrame(resetToArchiveTop)
    return () => cancelAnimationFrame(frame)
  }, [])

  useLayoutEffect(() => {
    if (!floatingScrollRequest || !filterSectionRef.current) return
    const filterPosition = filterSectionRef.current.getBoundingClientRect().top + window.scrollY - FILTER_POSITION_OFFSET
    scrollToTarget(filterPosition, {
      behavior: reducedMotion ? 'instant' : 'smooth',
    })
  }, [floatingScrollRequest, reducedMotion])

  useEffect(() => {
    let lastScrollY = window.scrollY
    let hideTimer: number | undefined

    const onScroll = () => {
      const y = window.scrollY
      const atTop = y <= 120
      const delta = y - lastScrollY

      setBackButtonAtTop((current) => current === atTop ? current : atTop)
      if (Math.abs(delta) > 3) {
        setShowBackButton(true)
        window.clearTimeout(hideTimer)
        if (!atTop) {
          hideTimer = window.setTimeout(() => setShowBackButton(false), BACK_BUTTON_SCROLL_HOLD)
        }
        lastScrollY = y
      } else if (atTop) {
        setShowBackButton(true)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.clearTimeout(hideTimer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <main className="relative mx-auto min-h-screen w-full min-w-0 max-w-[1600px] overflow-x-clip bg-white pb-[clamp(48px,6vw,96px)] text-black">
      <SoundToggle />
      <div className="relative">
        <div aria-hidden="true" className="mt-[clamp(24px,3vw,48px)] h-12" />
        {typeof document !== 'undefined' && createPortal(
          <div
            className={`fixed ${backButtonAtTop ? 'left-[clamp(64px,6.4vw,120px)]' : 'left-6'} top-4 z-[60] transition-[left,opacity,transform] duration-200 ease-out ${
              showBackButton
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none -translate-y-2 opacity-0'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#home'
              }}
              tabIndex={showBackButton ? 0 : -1}
              aria-label="Back to projects"
              className="inline-flex size-12 items-center justify-center rounded-[10px] border border-[#d2d2d7] bg-gradient-to-b from-white via-[#f7f7f8] to-[#ececef] text-[#1d1d1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.09)] transition-[background,border-color,box-shadow,transform] duration-150 hover:border-[#b8b8bd] hover:from-white hover:via-[#f4f4f5] hover:to-[#e5e5e8] hover:shadow-[inset_0_1px_0_#fff,0_3px_8px_rgba(0,0,0,0.12)] active:scale-[0.97] active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#666]"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
                <path d="M18 5.5v13a1 1 0 0 1-1.5.86l-11.2-6.5a1 1 0 0 1 0-1.72l11.2-6.5A1 1 0 0 1 18 5.5Z" />
              </svg>
            </button>
          </div>,
          document.body,
        )}

        <header className="mx-auto grid w-full grid-cols-1 items-center gap-5 px-[clamp(24px,6.4vw,102px)] py-5 sm:gap-7 md:min-h-[clamp(340px,31vw,500px)] md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)] md:gap-8 md:py-8">
          <h1 className="font-italic-serif order-1 z-10 w-full max-w-[860px] text-[clamp(24px,3.55vw,68px)] italic leading-[0.9] text-black">
            <span className="block">A Collection of Works</span>
            <span className="block">2025–26</span>
          </h1>
          <div className="order-2 mx-auto aspect-square w-full max-w-[380px] md:justify-self-center">
            <WorkPhotoSphere />
          </div>
        </header>

        <div ref={filterSectionRef} className="mx-auto w-[min(100%,1400px)]">
          <DraggableRulerFilter filters={filters} value={activeFilter} onChange={changeFilter} />
        </div>

        <section
          aria-label="Selected work"
          className="mx-auto mt-[clamp(36px,4.6vw,74px)] grid max-w-[1380px] grid-cols-1 gap-x-[clamp(16px,2.5vw,36px)] gap-y-[clamp(22px,2.5vw,40px)] px-5 sm:grid-cols-2 xl:grid-cols-6 xl:px-0"
        >
          {visibleCards.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-neutral-500">No projects for {activeFilter}.</p>
          ) : visibleCards.map((card, index) => (
            <article
              key={card.title}
              className={`relative col-span-1 w-full max-w-[356px] min-w-0 justify-self-center xl:col-span-2 ${
                visibleCards.length === 8 && index === 6 ? 'xl:col-start-2 xl:mt-[2.5vw]' : ''
              } ${visibleCards.length === 8 && index === 7 ? 'xl:col-start-4 xl:mt-[2.5vw]' : ''}`}
            >
              <button
                type="button"
                onClick={(event) => {
                  triggerRef.current = event.currentTarget
                  setSelectedProject(card)
                }}
                aria-label={`View ${card.title} project details`}
                className="group block w-full rounded-[32px] text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-700"
              >
                <motion.div
                  whileHover={reducedMotion ? { y: -3 } : { y: -8, scale: 1.02, rotateX: 1.2 }}
                  whileFocus={reducedMotion ? { y: -3 } : { y: -6, scale: 1.015 }}
                  transition={reducedMotion
                    ? { duration: 0.15 }
                    : { type: 'spring', stiffness: 260, damping: 23, mass: 0.7 }}
                  style={{ transformPerspective: 1000, transformOrigin: 'center center' }}
                  className={`relative aspect-[500/477] w-full overflow-hidden rounded-[32px] transition-shadow duration-300 ease-out group-hover:shadow-[0_10px_26px_rgba(0,0,0,0.12)] group-focus-visible:shadow-[0_10px_26px_rgba(0,0,0,0.12)] ${
                  card.title === 'Hanapbuhay' ? 'border border-neutral-300' : ''
                }`}>
                  <motion.div
                    className="h-full w-full"
                    whileHover={reducedMotion ? undefined : { scale: 1.045, y: -3 }}
                    transition={reducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 220, damping: 25, mass: 0.8 }}
                  >
                    <Preview card={card} />
                  </motion.div>
                </motion.div>
                <div className="mt-[clamp(10px,1vw,18px)] text-[clamp(10px,1.1vw,20px)] font-light leading-[1.16]">
                  <div className="flex items-center justify-between gap-2 border-b border-[#999] pb-[clamp(4px,0.6vw,8px)]">
                    <span className="shrink-0">PROJECT</span>
                    <span className="text-right">{card.title}</span>
                  </div>
                  <div className="pt-[clamp(4px,0.55vw,8px)]">({card.date})</div>
                  <span className="sr-only">Open project details</span>
                </div>
              </button>
            </article>
          ))}
        </section>
      </div>
      {selectedProject && (
        <ProjectNotebookDialog
          project={selectedProject}
          onClose={closeProject}
          returnFocusRef={triggerRef}
        />
      )}
    </main>
  )
}
