import type Lenis from 'lenis'

let lenisInstance: Lenis | undefined

export const projectScrollReturnKeys = [
  'loop-case-study-scroll-return',
  'aws-skill-builder-scroll-return',
  'bantay-contributions-scroll-return',
  'ease-contributions-scroll-return',
  'spot-contributions-scroll-return',
  'hanap-contributions-scroll-return',
  'awscc-contributions-scroll-return',
  'awsoff-contributions-scroll-return',
]

type ScrollBehavior = 'auto' | 'instant' | 'smooth'

type ScrollTarget = string | HTMLElement | number

type ScrollOptions = {
  behavior?: ScrollBehavior
  duration?: number
}

export function setLenis(instance?: Lenis) {
  lenisInstance = instance
}

export function refreshScrollDimensions() {
  lenisInstance?.resize()
}

export function rememberHomeScrollPosition() {
  sessionStorage.setItem('portfolio-home-scroll', JSON.stringify({
    scrollY: window.scrollY,
    hash: window.location.hash || '#home',
  }))
}

export function rememberResumeReturnPosition() {
  sessionStorage.setItem('portfolio-resume-return', JSON.stringify({
    scrollY: window.scrollY,
    hash: window.location.hash || '#resume',
  }))
}

export function rememberResumeViewPosition() {
  sessionStorage.setItem('portfolio-resume-view-return', JSON.stringify({
    scrollY: window.scrollY,
  }))
}

export function scrollToTarget(target: ScrollTarget, options?: ScrollOptions) {
  const behavior = options?.behavior ?? 'instant'

  if (lenisInstance) {
    lenisInstance.scrollTo(target, {
      duration: behavior === 'smooth' ? options?.duration ?? 1.2 : 0,
      immediate: behavior === 'instant',
      force: behavior === 'instant',
    })
    return
  }

  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior })
    return
  }

  const element = typeof target === 'string' ? document.querySelector(target) : target
  element?.scrollIntoView({ behavior })
}

export function scrollToSection(target: HTMLElement) {
  const scrollMarginTop = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0
  const top = window.scrollY + target.getBoundingClientRect().top - scrollMarginTop
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'

  scrollToTarget(top, {
    behavior,
    duration: 0.9,
  })
}