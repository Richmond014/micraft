import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight } from 'lucide-react'
import { DeferredImage } from '../ui/DeferredImage'
import { getResponsiveImageSrcSet } from '../../lib/assets'
import { scrollToTarget } from '../../lib/scroll'
import './AwsSkillBuilderCaseStudyPage.css'

const chapters = [
  { label: 'Overview', target: 'aws-overview' },
  { label: 'Learning Platform', target: 'aws-learning-platform' },
  { label: 'Community', target: 'aws-community' },
  { label: 'Showcase', target: 'aws-interface-details' },
] as const

const learningWorks = [
  { src: '/assets/figma/imgRectangle25.png', alt: 'AWS Skill Builder Departments landing page with cloud club branding and a learning journey.' },
  { src: '/assets/figma/imgRankS1.png', alt: 'Leaderboard screen with learner rankings and achievement visuals.' },
  { src: '/assets/figma/imgRectangle25.png', alt: 'Classroom submission and assignment review interface.' },
  { src: '/assets/figma/imgRectangle29.png', alt: 'AWS Skill Builder learning activity interface.' },
  { src: '/assets/figma/imgReportManagement1.png', alt: 'Report management interface with report statuses and moderation actions.' },
] as const

const interfaceScreens = [
  { src: 'e1751dca-f67f-40b6-9247-9e4b5cb4128f.png', label: "AWS Builder’s Path", alt: 'AWS Builder’s Path learning progress screen with achievement levels.' },
  { src: 'c34653c4-c65b-4750-afa9-4f1abc415358.png', label: 'Report Submission', alt: 'Report form with report categories and description fields.' },
  { src: '711fc84d-4c54-4117-ac54-edda6edc819a.png', label: 'Reports Dashboard', alt: 'Reports dashboard with search and status filters.' },
  { src: '54ce973a-9c94-4a27-ab4d-12fdaa9f7a51.png', label: 'Report Status Filters', alt: 'Report dashboard with status tabs and status filter menu.' },
  { src: 'dd3c9a7d-421e-4026-9821-af9cb0bc1beb.png', label: 'Report Management', alt: 'Report management list with review and dismissal controls.' },
  { src: '9d96c964-ddc3-49d8-a380-2bd3d2dd9299.png', label: 'Report Queue', alt: 'Filtered report queue with status badges and moderation actions.' },
  { src: '35e3e97d-17f8-4397-b055-7fe4543eaf5d.png', label: 'Pending Reports', alt: 'Pending report list with review and dismissal actions.' },
  { src: '9706bff9-e649-43f0-8467-0961c6410ac4.png', label: 'Report Review Panel', alt: 'Report management interface showing review details.' },
  { src: 'c8ff57a5-c775-4b41-a1e5-3d139adc33b8.png', label: 'Report Status Overview', alt: 'Report management dashboard with status filters and report cards.' },
  { src: 'report-details-cropped.png', label: 'Report Details', alt: 'Detailed report view with status, people involved, incident information, and moderation actions.' },
  { src: '197b6d7c-5e04-45e8-a3e8-da60bcdff892.png', label: 'Report Review Details', alt: 'Report detail review screen with reporter and incident details.' },
  { src: '35961125-0c95-4298-b007-ccb795b17567.png', label: 'Classroom Submissions', alt: 'Classroom activity list with student submissions and grading actions.' },
  { src: '86439af7-761e-4f3f-8393-bfbd713ed043.png', label: 'Submission Grading', alt: 'Assignment grading form with points, feedback, and excellence bonus.' },
  { src: '197f33ff-00aa-4a24-a899-3f8ebd74588c.png', label: 'Submission Link Preview', alt: 'Student submission card with a project link preview dialog.' },
  { src: '97a3c191-5e85-4c69-9e4f-6592d42db45b.png', label: 'Leaderboard', alt: 'Learner leaderboard with orbital ranking visuals and ranked learners.' },
] as const

function goBack() {
  const saved = sessionStorage.getItem('aws-skill-builder-return')
  let destination = { hash: '#works', scrollY: 0 }
  if (saved) {
    try { destination = JSON.parse(saved) as typeof destination } catch { /* Keep the portfolio fallback. */ }
  }
  sessionStorage.removeItem('aws-skill-builder-return')
  sessionStorage.setItem('aws-skill-builder-scroll-return', JSON.stringify(destination))
  window.location.hash = destination.hash.replace(/^#/, '') || 'works'
}

function ChapterNav() {
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(false)
  const [pill, setPill] = useState({ left: 0, width: 0 })
  const navRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<HTMLButtonElement[]>([])
  const activeRef = useRef(0)
  const lockUntil = useRef(0)
  const lockTimer = useRef<number | undefined>(undefined)

  const select = (index: number) => {
    activeRef.current = index
    setActive(index)
  }
  const movePill = (index: number, clickedTab?: HTMLButtonElement) => {
    const tab = clickedTab ?? tabRefs.current[index]
    if (!tab || !navRef.current) return
    setPill({ left: tab.offsetLeft, width: tab.offsetWidth })
  }

  useLayoutEffect(() => { movePill(active) }, [active])

  useEffect(() => {
    const sections = chapters.map(({ target }) => document.getElementById(target))
    const intersecting = new Map<number, Element>()
    const update = () => {
      const y = Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop)
      const heroPassed = Boolean(sections[0] && sections[0]!.getBoundingClientRect().bottom <= 0)
      setVisible(y > 120 || heroPassed)
      if (y <= 120 && !heroPassed) { select(0); return }
      if (window.innerHeight + y >= document.documentElement.scrollHeight - 2) { select(chapters.length - 1); return }
      if (performance.now() < lockUntil.current || !intersecting.size) return
      const referenceY = window.innerHeight * 0.425
      const current = [...intersecting.entries()].sort(([, a], [, b]) =>
        Math.abs((a.getBoundingClientRect().top + a.getBoundingClientRect().bottom) / 2 - referenceY)
        - Math.abs((b.getBoundingClientRect().top + b.getBoundingClientRect().bottom) / 2 - referenceY))[0]
      if (current) select(current[0])
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const index = sections.indexOf(entry.target as HTMLElement)
        if (index < 0) return
        if (entry.isIntersecting) intersecting.set(index, entry.target)
        else intersecting.delete(index)
      })
      update()
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 })
    sections.forEach((section) => {
      if (!section) return
      section.style.scrollMarginTop = '96px'
      observer.observe(section)
    })
    const onResize = () => { movePill(activeRef.current); update() }
    const onScrollEnd = () => {
      window.clearTimeout(lockTimer.current)
      lockUntil.current = 0
      update()
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('scrollend', onScrollEnd)
    update()
    return () => {
      observer.disconnect()
      window.clearTimeout(lockTimer.current)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scrollend', onScrollEnd)
    }
  }, [])

  const navigate = (index: number, tab: HTMLButtonElement) => {
    const section = document.getElementById(chapters[index].target)
    select(index)
    movePill(index, tab)
    if (!section) return
    lockUntil.current = performance.now() + 800
    window.clearTimeout(lockTimer.current)
    lockTimer.current = window.setTimeout(() => {
      lockUntil.current = 0
      window.dispatchEvent(new Event('scroll'))
    }, 800)
    const top = Math.max(0, section.getBoundingClientRect().top + window.scrollY - 96)
    scrollToTarget(top, { behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  return createPortal(
    <nav ref={navRef} aria-label="AWS Skill Builder sections" className={`aws-chapter-nav ${visible ? 'is-visible' : ''}`}>
      <span aria-hidden="true" className="aws-chapter-pill" style={{ width: pill.width, transform: `translateX(${pill.left}px)` }} />
      <div role="tablist" aria-label="Project sections" className="aws-chapter-tabs">
        {chapters.map((chapter, index) => (
          <button key={chapter.target} ref={(node) => { if (node) tabRefs.current[index] = node }} type="button" role="tab"
            data-target={chapter.target} aria-controls={chapter.target} aria-selected={active === index}
            aria-current={active === index ? 'location' : undefined} tabIndex={0}
            className={`aws-chapter-tab ${active === index ? 'is-active' : ''}`}
            onClick={(event) => navigate(index, event.currentTarget)}>
            <span>{chapter.label}</span>
          </button>
        ))}
      </div>
    </nav>, document.body,
  )
}

function ProjectImage({ src, alt, className = '', style, priority = false }: {
  src: string
  alt: string
  className?: string
  style?: CSSProperties
  priority?: boolean
}) {
  const srcSet = getResponsiveImageSrcSet(src)
  return (
    <DeferredImage
      className={`aws-project-image ${className}`}
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? '(min-width: 1385px) 540px, (min-width: 768px) 39vw, calc(100vw - 32px)' : undefined}
      alt={alt}
      priority={priority}
      style={style}
    />
  )
}

function useReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('.aws-reveal')
    if (!('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-revealed'))
      return
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-revealed')
      observer.unobserve(entry.target)
    }), { threshold: 0.08, rootMargin: '0px 0px -5% 0px' })
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [])
}

export function AwsSkillBuilderCaseStudyPage() {
  useReveal()
  const [showBackButton, setShowBackButton] = useState(() => typeof window === 'undefined' || window.scrollY <= 120)
  const [backButtonAtTop, setBackButtonAtTop] = useState(() => typeof window === 'undefined' || window.scrollY <= 120)

  useEffect(() => {
    let previousScrollY = window.scrollY
    let hideTimer: number | undefined
    const onScroll = () => {
      const currentScrollY = window.scrollY
      const atTop = currentScrollY <= 120
      const delta = currentScrollY - previousScrollY
      setBackButtonAtTop((current) => current === atTop ? current : atTop)
      if (Math.abs(delta) > 3 || atTop) {
        setShowBackButton(true)
        window.clearTimeout(hideTimer)
        if (!atTop) hideTimer = window.setTimeout(() => setShowBackButton(false), 1800)
        previousScrollY = currentScrollY
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.clearTimeout(hideTimer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <main className="aws-project-page">
      <ChapterNav />
      {typeof document !== 'undefined' && createPortal(
        <div className={`aws-back-button fixed top-4 z-[60] transition-[left,opacity,transform] duration-200 ease-out ${backButtonAtTop ? '' : 'aws-back-button--scrolled'} ${showBackButton ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`}>
          <button
            type="button"
            onClick={goBack}
            tabIndex={showBackButton ? 0 : -1}
            aria-label="Back to portfolio"
            className="inline-flex size-12 items-center justify-center rounded-[10px] border border-[#d2d2d7] bg-gradient-to-b from-white via-[#f7f7f8] to-[#ececef] text-[#1d1d1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.09)] transition-[background,border-color,box-shadow,transform] duration-150 hover:border-[#b8b8bd] hover:from-white hover:via-[#f4f4f5] hover:to-[#e5e5e8] hover:shadow-[inset_0_1px_0_#fff,0_3px_8px_rgba(0,0,0,0.12)] active:scale-[0.97] active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#666]"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
              <path d="M18 5.5v13a1 1 0 0 1-1.5.86l-11.2-6.5a1 1 0 0 1 0-1.72l11.2-6.5A1 1 0 0 1 18 5.5Z" />
            </svg>
          </button>
        </div>,
        document.body,
      )}

      <section id="aws-overview" className="aws-overview aws-project-section">
        <div className="aws-overview-copy">
          <h1>AWS Skill Builder</h1>
          <p className="aws-lede">A community built around learning, sharing knowledge, and growing together through technology.</p>
          <dl className="aws-project-meta">
            <div><dt>Project</dt><dd>Learning platform</dd></div>
            <div><dt>Role</dt><dd>UI/UX Designer</dd></div>
            <div><dt>Timeline</dt><dd>February 2026</dd></div>
          </dl>
        </div>
        <figure className="aws-overview-art">
          <ProjectImage src="/assets/figma/imgRectangle25.png" alt="AWS Skill Builder landing page concept with a cloud club mascot, learning journey, and cloud themed interface." priority />
        </figure>
      </section>

      <section id="aws-learning-platform" className="aws-project-section aws-section-light">
        <div className="aws-section-heading">
          <p className="aws-eyebrow">/ Learning experience</p>
          <h2>Learning, with a sense of progress.</h2>
          <p>Members can explore lessons, join activities, and keep track of their progress. The space-inspired visuals and reward elements bring everything together under one community experience.</p>
        </div>
        <div className="aws-work-marquee" aria-label="Selected AWS Skill Builder screens">
          <div className="aws-work-marquee-track">
            {[0, 1].map((copy) => (
              <div className="aws-work-marquee-group" key={copy} aria-hidden={copy === 1}>
                {learningWorks.map((work) => (
                  <figure className="aws-work-marquee-card" key={work.src}>
                    <ProjectImage src={work.src} alt={copy === 0 ? work.alt : ''} />
                  </figure>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="aws-community" className="aws-project-section aws-section-violet">
        <div className="aws-community-intro">
          <p className="aws-eyebrow">/ Community</p>
          <h2>A community with its own identity.</h2>
          <p>The purple colors, mascot, and space-inspired visuals reflect the personality of AWS Cloud Club PUP. Together, they give the community a recognizable identity and make members feel part of something shared.</p>
          <a className="aws-live-link" href="https://sbd.awsccpup.cloud/?fbclid=IwY2xjawVlRTtleHRuA2FlbQIxMABwZG9mBWJyaWQRMTVOSGdFOElNaDVqdDRYc2VzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEfXUjfJsQy8qZFRJlPj8sSLysXlQyRXvaxtQkLMoJRBQTqWbAuADOj5EmhQD8_aem_rZEa_9pEBkFomO9bpaQOuw" target="_blank" rel="noreferrer">Visit the live site <ArrowUpRight aria-hidden="true" size={17} /></a>
        </div>
        <figure className="aws-community-art" style={{ overflow: 'hidden', borderRadius: 28 }}>
          <ProjectImage src="/assets/figma/SBD%20NEW.png" alt="AWS Skill Builder community artwork featuring the AWS Cloud Club PUP website and membership ID finder." style={{ borderRadius: 28, clipPath: 'inset(0 round 28px)' }} />
          <figcaption><span>Community artwork · Florence Lee Cansino</span></figcaption>
        </figure>
      </section>

      <section id="aws-interface-details" className="aws-project-section aws-section-light">
        <div className="aws-section-heading aws-heading-row">
          <div><p className="aws-eyebrow">/ Showcase</p><h2>A closer look at the finished interfaces.</h2></div>
        </div>
        <div className="aws-ui-gallery">
          {interfaceScreens.map((screen) => (
            <figure className={`aws-ui-card${screen.label === 'Report Submission' ? ' aws-ui-card--report-submission' : ''}`} key={screen.src}>
              <figcaption>// {screen.label}</figcaption>
              <ProjectImage src={`/assets/figma/${encodeURIComponent(screen.src)}`} alt={screen.alt} />
            </figure>
          ))}
        </div>
      </section>

      <footer id="aws-footer" className="aws-project-footer">
        <ProjectImage src="/assets/figma/FOOTER%20PHOTOOOO.jpe" alt="Two collaborators taking time to review a project together." />
        <div className="aws-footer-copy">
          <h2>Thanks for taking the time to explore.</h2>
          <p>I appreciate you looking through this project and the learning experience behind it.</p>
          <button type="button" onClick={goBack} className="aws-return-link">Back to portfolio <ArrowUpRight aria-hidden="true" size={17} /></button>
        </div>
      </footer>
    </main>
  )
}
