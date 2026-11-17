import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from 'react'
import { AboutSection } from './components/about/AboutSection'
import { ContactSection } from './components/contact/ContactSection'
import { ExperienceSection } from './components/experience/ExperienceSection'
import { Hero } from './components/hero/Hero'
import { Navigation } from './components/navigation/Navigation'
import { ProjectsSection } from './components/projects/ProjectsSection'
import { MakingProcess } from './components/timeline/MakingProcess'
import { Footer } from './components/contact/Footer'
import { PageLoader } from './components/ui/PageLoader'
import { CurtainReveal, type CurtainPhase } from './components/ui/CurtainReveal'
import { SoundToggle } from './components/ui/SoundToggle'
import { NetworkStatus } from './components/ui/NetworkStatus'
import { assets } from './lib/assets'
import { projectScrollReturnKeys, refreshScrollDimensions, scrollToTarget } from './lib/scroll'
import { PageNavigationContext, type CurtainPalette } from './lib/PageNavigationContext'
import { useLenis } from './hooks/useLenis'
import { useReducedMotion } from './hooks/useMediaQuery'

const pages: Partial<Record<string, LazyExoticComponent<ComponentType>>> = {
  '#loop-case-study': lazy(() =>
    import('./components/projects/LoopCaseStudyPage.tsx').then((module) => ({
      default: module.LoopCaseStudyPage,
    })),
  ),
  '#aws-skill-builder-case-study': lazy(() =>
    import('./components/projects/AwsSkillBuilderCaseStudyPage.tsx').then((module) => ({
      default: module.AwsSkillBuilderCaseStudyPage,
    })),
  ),
  '#bantay-contributions': lazy(() =>
    import('./components/projects/BantayContributionsPage.tsx').then((module) => ({
      default: module.BantayContributionsPage,
    })),
  ),
  '#ease-contributions': lazy(() =>
    import('./components/projects/EaseServiceContributionsPage.tsx').then((module) => ({
      default: module.EaseServiceContributionsPage,
    })),
  ),
  '#spotify-contributions': lazy(() =>
    import('./components/projects/SpotifyContributionsPage.tsx').then((module) => ({
      default: module.SpotifyContributionsPage,
    })),
  ),
  '#hanap-contributions': lazy(() =>
    import('./components/projects/HanapBuhayContributionsPage.tsx').then((module) => ({
      default: module.HanapBuhayContributionsPage,
    })),
  ),
  '#awscc-contributions': lazy(() =>
    import('./components/projects/AwsCloudClubWebsiteContributionsPage.tsx').then((module) => ({
      default: module.AwsCloudClubWebsiteContributionsPage,
    })),
  ),
  '#awsoff-contributions': lazy(() =>
    import('./components/projects/AwsOfficialSiteContributionsPage.tsx').then((module) => ({
      default: module.AwsOfficialSiteContributionsPage,
    })),
  ),
  '#works': lazy(() =>
    import('./components/projects/WorksArchivePage.tsx').then((module) => ({
      default: module.WorksArchivePage,
    })),
  ),
  '#resume': lazy(() =>
    import('./components/resume/ResumePage.tsx').then((module) => ({
      default: module.ResumePage,
    })),
  ),
}

type PendingNavigation = {
  hash: string
  updateLocation: boolean
  palette?: CurtainPalette
}

function routeIdentity(hash: string) {
  return pages[hash] ? hash : '#home'
}

function restoreScrollPosition(scrollY: number | undefined) {
  requestAnimationFrame(() => {
    refreshScrollDimensions()
    scrollToTarget(scrollY ?? 0)
  })
}

function restoreResumeViewPosition() {
  const saved = sessionStorage.getItem('portfolio-resume-view-return')
  if (!saved) return

  sessionStorage.removeItem('portfolio-resume-view-return')
  try {
    const destination = JSON.parse(saved) as { scrollY?: number }
    restoreScrollPosition(destination.scrollY)
  } catch {
    sessionStorage.removeItem('portfolio-resume-view-return')
  }
}

function App() {
  useLenis()
  const reducedMotion = useReducedMotion()
  const hasResumeViewReturn = sessionStorage.getItem('portfolio-resume-view-return') !== null
  const [hash, setHash] = useState(() => window.location.hash)
  const [curtainPhase, setCurtainPhase] = useState<CurtainPhase>('idle')
  const [curtainPalette, setCurtainPalette] = useState<CurtainPalette>()
  const hashRef = useRef(hash)
  const curtainPhaseRef = useRef<CurtainPhase>('idle')
  const pendingNavigationRef = useRef<PendingNavigation | null>(null)
  const paletteByHashRef = useRef(new Map<string, CurtainPalette>())
  const expectedHashChangeRef = useRef<string | null>(null)
  const Page = pages[hash]

  const changeCurtainPhase = useCallback((phase: CurtainPhase) => {
    curtainPhaseRef.current = phase
    setCurtainPhase(phase)
  }, [])

  const commitNavigation = useCallback((navigation: PendingNavigation) => {
    if (navigation.updateLocation && window.location.hash !== navigation.hash) {
      expectedHashChangeRef.current = navigation.hash
      window.location.hash = navigation.hash
    }

    hashRef.current = navigation.hash
    setHash(navigation.hash)
  }, [])

  const navigateToHash = useCallback((nextHash: string, palette?: CurtainPalette) => {
    const targetHash = nextHash.startsWith('#') ? nextHash : `#${nextHash}`
    if (curtainPhaseRef.current !== 'idle') return

    if (palette) paletteByHashRef.current.set(targetHash, palette)
    const navigation = {
      hash: targetHash,
      updateLocation: true,
      palette: palette ?? paletteByHashRef.current.get(targetHash),
    }

    if (reducedMotion || routeIdentity(hashRef.current) === routeIdentity(targetHash)) {
      commitNavigation(navigation)
      return
    }

    pendingNavigationRef.current = navigation
    setCurtainPalette(navigation.palette)
    changeCurtainPhase('covering')
  }, [changeCurtainPhase, commitNavigation, reducedMotion])

  useEffect(() => {
    const onLocationChange = () => {
      const nextHash = window.location.hash
      const expectedHash = expectedHashChangeRef.current
      expectedHashChangeRef.current = null
      if (expectedHash === nextHash) return

      const navigation = {
        hash: nextHash,
        updateLocation: false,
        palette: paletteByHashRef.current.get(nextHash),
      }
      const phase = curtainPhaseRef.current

      if (phase !== 'idle') {
        pendingNavigationRef.current = navigation
        setCurtainPalette(navigation.palette)
        if (phase === 'covered') commitNavigation(navigation)
        if (phase === 'revealing') changeCurtainPhase('covering')
        return
      }

      if (reducedMotion || routeIdentity(hashRef.current) === routeIdentity(nextHash)) {
        commitNavigation(navigation)
        return
      }

      pendingNavigationRef.current = navigation
      setCurtainPalette(navigation.palette)
      changeCurtainPhase('covering')
    }

    window.addEventListener('hashchange', onLocationChange)
    window.addEventListener('popstate', onLocationChange)
    return () => {
      window.removeEventListener('hashchange', onLocationChange)
      window.removeEventListener('popstate', onLocationChange)
    }
  }, [changeCurtainPhase, commitNavigation, reducedMotion])

  const onCurtainCovered = useCallback(() => {
    if (curtainPhaseRef.current !== 'covering') return

    const navigation = pendingNavigationRef.current
    if (!navigation) {
      changeCurtainPhase('idle')
      return
    }

    commitNavigation(navigation)
    changeCurtainPhase('covered')
  }, [changeCurtainPhase, commitNavigation])

  const onCurtainRevealed = useCallback(() => {
    if (curtainPhaseRef.current !== 'revealing') return
    pendingNavigationRef.current = null
    changeCurtainPhase('idle')
  }, [changeCurtainPhase])

  useEffect(() => {
    if (curtainPhase !== 'covered') return

    const timer = window.setTimeout(() => {
      if (curtainPhaseRef.current === 'covered') changeCurtainPhase('revealing')
    }, reducedMotion ? 0 : 100)

    return () => window.clearTimeout(timer)
  }, [changeCurtainPhase, curtainPhase, hash, reducedMotion])

  useLayoutEffect(() => {
    if (Page && hash !== '#works') scrollToTarget(0)
  }, [Page, hash])

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (
        event.persisted &&
        window.location.hash === '#resume' &&
        document.body.style.overflow !== 'hidden'
      ) {
        restoreResumeViewPosition()
      }
    }

    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  useEffect(() => {
    if (Page && hash !== '#works') return

    if (hash === '#resume-return') {
      const saved = sessionStorage.getItem('portfolio-resume-return')
      sessionStorage.removeItem('portfolio-resume-return')
      if (saved) {
        try {
          const destination = JSON.parse(saved) as { scrollY?: number }
          restoreScrollPosition(destination.scrollY)
        } catch {
          sessionStorage.removeItem('portfolio-resume-return')
        }
      }
      return
    }

    for (const key of projectScrollReturnKeys) {
      const saved = sessionStorage.getItem(key)
      if (!saved) continue

      sessionStorage.removeItem(key)
      try {
        const destination = JSON.parse(saved) as { scrollY?: number }
        restoreScrollPosition(destination.scrollY)
      } catch {
        sessionStorage.removeItem(key)
      }
      return
    }

    if (hash === '' || hash === '#home') {
      const saved = sessionStorage.getItem('portfolio-home-scroll')
      sessionStorage.removeItem('portfolio-home-scroll')
      if (saved) {
        try {
          const destination = JSON.parse(saved) as { scrollY?: number }
          restoreScrollPosition(destination.scrollY)
        } catch {
          sessionStorage.removeItem('portfolio-home-scroll')
        }
      }
    }
  }, [Page, hash])

  const content = Page ? (
    <Suspense fallback={<div className="min-h-svh bg-white" aria-busy="true" />}>
      <Page />
    </Suspense>
  ) : (
      <div className="min-h-svh bg-white font-sans font-light text-black">
        <Navigation />
        <main>
          <Hero />
          <ProjectsSection />
          <ExperienceSection />
          <AboutSection />
          <MakingProcess />
          <ContactSection />
        </main>
        <Footer />
        <SoundToggle />
      </div>
  )

  return (
    <PageNavigationContext.Provider value={navigateToHash}>
      <PageLoader
        logo={assets.loader.logoBlack}
        imageAspectRatio={1}
        fillOrder="center"
        cols={6}
        rows={6}
        urls={assets.preload}
        brand="MICHAEL"
        scrollToTopOnOpen={!hasResumeViewReturn}
        onComplete={restoreResumeViewPosition}
      >
        {content}
      </PageLoader>
      <NetworkStatus />
      <CurtainReveal
        phase={curtainPhase}
        reducedMotion={reducedMotion}
        palette={curtainPalette}
        onCovered={onCurtainCovered}
        onRevealed={onCurtainRevealed}
      />
    </PageNavigationContext.Provider>
  )
}

export default App
