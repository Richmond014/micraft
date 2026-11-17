import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { useSound } from '../../hooks/useSound'
import { assets } from '../../lib/assets'
import { scrollToTarget } from '../../lib/scroll'

const navItems = [
  { label: 'Home', href: '#top', icon: 'home' },
  { label: 'Work', href: '#projects', icon: 'briefcase' },
  { label: 'About', href: '#about', icon: 'person' },
  { label: 'Contact', href: '#contact', icon: 'mail' },
]

const sectionRoutes = [
  { selector: '#top', href: '#top' },
  { selector: '#projects', href: '#projects' },
  { selector: '#experience', href: '#projects' },
  { selector: '#about', href: '#about' },
  { selector: '#making-process', href: '#about' },
  { selector: '#contact', href: '#contact' },
]

// ---- Tuning knobs -----------------------------------------------------
const LOGO_WIDTH = 60
const LOGO_NUDGE = { x: 0, y: -2.5 }

// Keep the full bar spread out while the page is at the very top (Home).
// Everywhere else it only shows on hover or while scrolling up.
const SPREAD_AT_TOP = true
// Show the MR monogram on Home and the current section icon elsewhere.
const LOGO_ON_HOME = true
// How long the bar stays spread after you stop scrolling up (ms)
const SCROLL_UP_HOLD = 2200
// Half-width (px) of the top hover zone that wakes the bar
const HOVER_ZONE_HALF_WIDTH = 260

// Apple-style ease: fast start, long soft landing, no bounce
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'
const GROW_MS = 340 // a single button growing to show its label
// -----------------------------------------------------------------------

const BAR_H = 64
const BUTTON_SIZE = 42
const ICON_PAD = 11 // (42 - 20) / 2: icon is dead-center when collapsed
const PILL_PAD = 9
const GAP = 8
const LOGO_SIZE = 52
const STUB = LOGO_SIZE / 2 + GAP // space between the logo's centre and the nearest button
const FOLD_DURATION = 320
// Dynamic-Island style motion: spring-driven, folds into the centre circle
const OPEN_SPRING = { type: 'spring', stiffness: 300, damping: 28, mass: 0.9 } as const
const CLOSE_SPRING = { type: 'spring', stiffness: 380, damping: 38 } as const
const FOLDED = { scaleX: 0.16, scaleY: 0.5, opacity: 0 } // how small the bar gets when it folds away

// SF Symbols-style glyphs: one consistent rounded stroke, 24px grid, optical weight ~ "regular"
function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'text-[#242424]',
    style: { width: size, height: size },
    'aria-hidden': true,
  }
  switch (name) {
    case 'home':
      // house
      return (
        <svg {...props}>
          <path d="M4 10.8 12 4l8 6.8V19a1.6 1.6 0 0 1-1.6 1.6H15v-5.2a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5.2H5.6A1.6 1.6 0 0 1 4 19v-8.2Z" />
        </svg>
      )
    case 'briefcase':
      // briefcase: work / projects
      return (
        <svg {...props}>
          <path d="M5 8h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
          <path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8" />
          <path d="M3 13c3 1.6 6 2.4 9 2.4s6-.8 9-2.4" />
        </svg>
      )
    case 'person':
      // person: about me
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.6" />
          <path d="M5 20c.6-3.6 3.3-5.6 7-5.6s6.4 2 7 5.6" />
        </svg>
      )
    case 'mail':
      // envelope: contact
      return (
        <svg {...props}>
          <path d="M5.5 5.5h13A2.5 2.5 0 0 1 21 8v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16V8a2.5 2.5 0 0 1 2.5-2.5Z" />
          <path d="m3.4 8.2 7.6 5a1.7 1.7 0 0 0 2 0l7.6-5" />
        </svg>
      )
    default:
      return null
  }
}

function NavButton({
  item,
  active,
  reduced,
  onActivate,
}: {
  item: { label: string; href: string; icon: string }
  active: boolean
  reduced: boolean
  onActivate: (href: string) => void
}) {
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const [tapped, setTapped] = useState(false)
  const labelRef = useRef<HTMLSpanElement>(null)
  const [labelW, setLabelW] = useState(0)

  const expanded = hovering || focused || tapped

  // offsetWidth ignores CSS transforms, so the measurement is always the real text width
  useLayoutEffect(() => {
    let cancelled = false
    const measure = () => {
      if (!cancelled && labelRef.current) setLabelW(Math.ceil(labelRef.current.offsetWidth))
    }
    measure()
    document.fonts?.ready.then(measure).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [item.label])

  useEffect(() => {
    if (!tapped) return
    const t = window.setTimeout(() => setTapped(false), 650)
    return () => window.clearTimeout(t)
  }, [tapped])

  // icon + gap + text, with the same padding on the right as the icon has on the left
  const expandedWidth = ICON_PAD + 20 + GAP + labelW + ICON_PAD + 2

  return (
    <motion.button
      type="button"
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      onClick={() => {
        setTapped(true)
        onActivate(item.href)
      }}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onFocus={(e) => {
        if (e.currentTarget.matches(':focus-visible')) setFocused(true)
      }}
      onBlur={() => setFocused(false)}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 520, damping: 32 }}
      className={`relative h-[42px] shrink-0 overflow-hidden rounded-full outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/40 ${
        active || expanded ? 'z-10 ' : ''
      }${
        active || expanded
          ? 'bg-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_4px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.05]'
          : 'bg-[#d3d3d8] hover:bg-[#c9c9cf]'
      }`}
      style={{
        width: expanded && labelW ? expandedWidth : BUTTON_SIZE,
        transition: reduced ? 'none' : `width ${GROW_MS}ms ${EASE}, background-color 250ms ease`,
      }}
    >
      {/* The icon never moves; the button just widens to uncover the label */}
      <span className="absolute top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center" style={{ left: ICON_PAD }}>
        <Icon name={item.icon} />
      </span>
      <span
        ref={labelRef}
        className="absolute inset-y-0 flex items-center whitespace-nowrap text-[13px] font-medium leading-none tracking-[-0.01em] text-[#242424]"
        style={{
          left: ICON_PAD + 20 + GAP,
          opacity: expanded ? 1 : 0,
          transform: expanded ? 'translateX(0)' : 'translateX(-6px)',
          transition: reduced
            ? 'none'
            : `opacity ${expanded ? 220 : 120}ms ease ${expanded ? 70 : 0}ms, transform ${GROW_MS}ms ${EASE}`,
        }}
      >
        {item.label}
      </span>
    </motion.button>
  )
}

/**
 * One half of the bar. It is anchored to the exact centre of the logo and always laid out
 * at full width, so when a button expands nothing else on the bar ever moves.
 * The bar pops in: it drops down a little from above with a springy overshoot while fading in,
 * and leaves with a quick, clean fade-up. Nothing spreads sideways.
 */
function Half({
  side,
  open,
  children,
}: {
  side: 'left' | 'right'
  open: boolean
  children: ReactNode
}) {
  const left = side === 'left'

  return (
    <div
      className="absolute top-0 grid items-center"
      style={{
        height: BAR_H,
        width: 'max-content', // size to the content, not to the zero-width anchor
        [left ? 'right' : 'left']: -1, // 1px overlap hides the seam under the logo
        gridTemplateColumns: left ? `1fr ${STUB + 1}px` : `${STUB + 1}px 1fr`,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* Light gray pill background */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 border-y border-white/80 bg-[#e5e5e9]/95 backdrop-blur-xl ${
          left ? 'rounded-l-full border-l' : 'rounded-r-full border-r'
        }`}
      />
      {left && (
        <div className="relative min-w-0 overflow-x-clip overflow-y-visible">
          <div className="flex items-center justify-end" style={{ gap: GAP, paddingLeft: PILL_PAD }}>
            {children}
          </div>
        </div>
      )}
      <div />
      {!left && (
        <div className="relative min-w-0 overflow-x-clip overflow-y-visible" style={{ gridColumn: 2, gridRow: 1 }}>
          <div className="flex items-center" style={{ gap: GAP, paddingRight: PILL_PAD }}>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

export function Navigation() {
  const reduced = useReducedMotion()
  const { play } = useSound()
  const [activeHref, setActiveHref] = useState('#top')
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const [pointerNear, setPointerNear] = useState(false)
  const [atTop, setAtTop] = useState(true)
  const [scrollingUp, setScrollingUp] = useState(false)
  const lastScrollY = useRef(0)
  const scrollIdle = useRef<number | undefined>(undefined)
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    let scrollFrame = 0
    const updateScrollState = () => {
      scrollFrame = 0
      const y = window.scrollY
      const delta = y - lastScrollY.current
      setAtTop(y < 90)
      // Track which section is currently in view so the folded bar can show it
      let current = '#top'
      for (const section of sectionRoutes) {
        try {
          const el = document.querySelector(section.selector)
          if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) current = section.href
        } catch {
          /* ignore invalid selectors */
        }
      }
      setActiveHref(current)
      if (Math.abs(delta) > 4) {
        setScrollingUp(delta < 0)
        lastScrollY.current = y
      }
      window.clearTimeout(scrollIdle.current)
      scrollIdle.current = window.setTimeout(() => setScrollingUp(false), SCROLL_UP_HOLD)
    }
    const onScroll = () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollState)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
      window.clearTimeout(scrollIdle.current)
    }
  }, [])

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const nearCenter = Math.abs(e.clientX - window.innerWidth / 2) <= HOVER_ZONE_HALF_WIDTH
      setPointerNear(e.clientY <= 110 && nearCenter)
    }
    const onLeaveWindow = () => setPointerNear(false)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeaveWindow)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', onLeaveWindow)
    }
  }, [])

  // open  = the full bar is spread out
  // shown = at least the logo circle is on screen
  const open = (SPREAD_AT_TOP && atTop) || hovering || focused || pointerNear || scrollingUp

  // Keep the nav mounted just long enough for the fold-away animation to finish
  const [lingering, setLingering] = useState(false)
  useEffect(() => {
    if (open) {
      setLingering(true)
      return
    }
    const t = window.setTimeout(() => setLingering(false), reduced ? 0 : FOLD_DURATION)
    return () => window.clearTimeout(t)
  }, [open, reduced])

  const shown = open || lingering

  const activate = (href: string) => {
    play('tick')
    setActiveHref(href)
    scrollToTarget(href, { behavior: 'smooth' })
  }

  const activeItem = navItems.find((item) => item.href === activeHref) ?? navItems[0]
  const showMonogram = LOGO_ON_HOME && activeHref === '#top'

  return (
    // A zero-width anchor sitting exactly at the horizontal centre of the screen.
    // The logo and both halves are positioned from this point, so the logo can never drift.
    <nav
      ref={rootRef}
      aria-label="Primary"
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onFocus={(event) => {
        // Only keyboard focus keeps the bar open, so a mouse click doesn't pin it
        if ((event.target as HTMLElement).matches(':focus-visible')) setFocused(true)
      }}
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null
        if (!rootRef.current?.contains(next)) setFocused(false)
      }}
      className="fixed left-1/2 top-5 z-50 w-0"
      style={{
        height: BAR_H,
        opacity: shown ? 1 : 0,
        visibility: shown ? 'visible' : 'hidden',
        pointerEvents: shown ? 'auto' : 'none',
      }}
    >
      {/* Both halves move as ONE rigid piece, with a solid bridge behind the logo,
          so there is never a seam/line down the middle of the bar */}
      <motion.div
        className="absolute left-0 top-0"
        initial={false}
        animate={open ? { scaleX: 1, scaleY: 1, opacity: 1 } : FOLDED}
        transition={
          reduced
            ? { duration: 0 }
            : {
                ...(open ? OPEN_SPRING : CLOSE_SPRING),
                opacity: { duration: open ? 0.16 : 0.2, ease: 'easeOut' },
              }
        }
        style={{
          width: 0,
          height: BAR_H,
          transformOrigin: '0px 50%', // folds toward the logo's centre
          pointerEvents: open ? 'auto' : 'none',
          filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.12))',
        }}
      >
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 border-y border-white/80 bg-[#e5e5e9]/95 backdrop-blur-xl"
        style={{ left: -STUB, width: STUB * 2, height: BAR_H }}
      />
      <Half side="left" open={open}>
        {navItems.slice(0, 2).map((item) => (
          <NavButton key={item.label} item={item} active={activeHref === item.href} reduced={reduced} onActivate={activate} />
        ))}
      </Half>

      <Half side="right" open={open}>
        {navItems.slice(2).map((item) => (
          <NavButton key={item.label} item={item} active={activeHref === item.href} reduced={reduced} onActivate={activate} />
        ))}
      </Half>
      </motion.div>

      {/* Logo: always exactly at the anchor */}
      <motion.div
        className="absolute left-0 top-0 z-10 flex items-center justify-center"
        initial={false}
        animate={open ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
        transition={reduced ? { duration: 0 } : open ? OPEN_SPRING : { duration: 0.22, ease: 'easeOut' }}
        style={{ width: LOGO_SIZE, height: BAR_H, marginLeft: -LOGO_SIZE / 2 }}
      >
        <motion.button
          type="button"
          onClick={() => activate('#top')}
          aria-label="Back to top"
          whileTap={reduced ? undefined : { scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.9 }}
          className="relative shrink-0 overflow-hidden rounded-full border-2 border-[#55555a] bg-gradient-to-b from-white to-[#ececf0] p-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.16)] outline-none focus-visible:ring-2 focus-visible:ring-black/40"
          style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
        >
          <AnimatePresence initial={false}>
            {showMonogram ? (
              <motion.span
                key="monogram"
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 32 }}
              >
                {assets.nav.monogram && (
                  <img
                    src={assets.nav.monogram}
                    alt="MR"
                    draggable={false}
                    className="pointer-events-none absolute left-1/2 top-1/2 h-auto max-w-none select-none"
                    style={{
                      width: LOGO_WIDTH,
                      transform: `translate(calc(-50% + ${LOGO_NUDGE.x}px), calc(-50% + ${LOGO_NUDGE.y}px))`,
                      filter: 'invert(1)',
                    }}
                  />
                )}
              </motion.span>
            ) : (
              <motion.span
                key={activeItem.href}
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 32 }}
              >
                <Icon name={activeItem.icon} size={24} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>
    </nav>
  )
}
