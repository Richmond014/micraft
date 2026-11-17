import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { useSound } from '../../hooks/useSound'

type DraggableRulerFilterProps = {
  filters: string[]
  value: string
  onChange: (value: string, fromFloating?: boolean) => void
}

type PointerDrag = {
  pointerId: number
  pointerX: number
  startOffset: number
  startIndex: number | null
  lastX: number
  lastTime: number
  velocity: number
  hasMoved: boolean
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const FLOATING_FILTERS_SCROLL_UP_HOLD = 2200
const FLOATING_FILTERS_HOVER_ZONE_HALF_WIDTH = 260
const FLOATING_FILTERS_GAP = 4
const FLOATING_FILTERS_PADDING = 4

export function DraggableRulerFilter({ filters, value, onChange }: DraggableRulerFilterProps) {
  const reducedMotion = useReducedMotion()
  const { play } = useSound()
  const id = useId()
  const rulerRef = useRef<HTMLDivElement>(null)
  const filterViewportRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<HTMLButtonElement[]>([])
  const floatingTabRefs = useRef<HTMLButtonElement[]>([])
  const drag = useRef<PointerDrag | null>(null)
  const suppressClickUntil = useRef(0)
  const floatingHasFocus = useRef(false)
  const updateFloatingVisibility = useRef<() => void>(() => {})
  const [tabsOffset, setTabsOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showFloatingFilters, setShowFloatingFilters] = useState(false)
  const [dimensions, setDimensions] = useState({ ruler: 0, viewport: 0, tabs: 0 })

  const selectedIndex = Math.max(0, filters.indexOf(value))
  const floatingFilters = useMemo(() => {
    const ordered = [...filters]
    const activeIndex = ordered.indexOf(value)
    if (activeIndex < 0 || !ordered.length) return ordered
    const [active] = ordered.splice(activeIndex, 1)
    ordered.splice(Math.floor(filters.length / 2), 0, active)
    return ordered
  }, [filters, value])
  const slotWidth = filters.length ? dimensions.tabs / filters.length : 0
  const filterCenters = useMemo(
    () => filters.map((_, index) => ((filters.length - 1) / 2 - index) * slotWidth),
    [filters, slotWidth],
  )
  const range = Math.max(0, ...filterCenters.map(Math.abs))
  const tickPositions = useMemo(
    () => Array.from({ length: Math.ceil(dimensions.ruler / 12) + 1 }, (_, index) => index * 12),
    [dimensions.ruler],
  )
  const tabsWidth = dimensions.tabs
  const floatingWidth = dimensions.tabs
    ? Math.min(dimensions.tabs, dimensions.viewport || dimensions.tabs)
    : 480
  const floatingButtonWidth = filters.length
    ? (floatingWidth - FLOATING_FILTERS_PADDING * 2 - FLOATING_FILTERS_GAP * (filters.length - 1)) / filters.length
    : 0
  const floatingCollapsedWidth = Math.min(
    floatingWidth,
    Math.max(56, floatingButtonWidth + FLOATING_FILTERS_PADDING * 2),
  )

  const moveToIndex = (index: number) => {
    const center = filterCenters[index]
    if (center === undefined) return
    setTabsOffset(center)
  }

  useEffect(() => {
    const ruler = rulerRef.current
    const viewport = filterViewportRef.current
    const tabs = tabsRef.current
    if (!ruler || !viewport || !tabs) return
    const measure = () => {
      const next = { ruler: ruler.clientWidth, viewport: viewport.clientWidth, tabs: tabs.scrollWidth }
      setDimensions((current) => {
        if (current.ruler === next.ruler && current.viewport === next.viewport && current.tabs === next.tabs) return current
        return next
      })
      if (!drag.current && tabs.scrollWidth && filters.length) {
        const index = Math.max(0, filters.indexOf(value))
        setTabsOffset(((filters.length - 1) / 2 - index) * (tabs.scrollWidth / filters.length))
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(ruler)
    observer.observe(viewport)
    observer.observe(tabs)
    return () => observer.disconnect()
  }, [filters.length])

  useEffect(() => {
    let scrollingUp = false
    let pointerNear = false
    let lastScrollY = window.scrollY
    let scrollIdle: number | undefined

    const updateVisibility = () => {
      const viewport = filterViewportRef.current
      if (!viewport) return
      const next = viewport.getBoundingClientRect().bottom < 88
        && (scrollingUp || pointerNear || floatingHasFocus.current)
      setShowFloatingFilters((current) => current === next ? current : next)
    }

    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastScrollY
      if (Math.abs(delta) > 4) {
        scrollingUp = delta < 0
        lastScrollY = y
      }
      window.clearTimeout(scrollIdle)
      scrollIdle = window.setTimeout(() => {
        scrollingUp = false
        updateVisibility()
      }, FLOATING_FILTERS_SCROLL_UP_HOLD)
      updateVisibility()
    }

    const onPointerMove = (event: PointerEvent) => {
      const nearCenter = Math.abs(event.clientX - window.innerWidth / 2) <= FLOATING_FILTERS_HOVER_ZONE_HALF_WIDTH
      pointerNear = event.clientY <= 110 && nearCenter
      updateVisibility()
    }

    const onPointerLeave = () => {
      pointerNear = false
      updateVisibility()
    }

    updateFloatingVisibility.current = updateVisibility
    updateVisibility()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateVisibility)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
    return () => {
      window.clearTimeout(scrollIdle)
      updateFloatingVisibility.current = () => {}
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateVisibility)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  useEffect(() => {
    if (!dimensions.ruler || !dimensions.viewport || !dimensions.tabs || filterCenters.length !== filters.length || drag.current) return
    moveToIndex(selectedIndex)
    if (!isInitialized) requestAnimationFrame(() => setIsInitialized(true))
  }, [dimensions.ruler, dimensions.viewport, dimensions.tabs, filterCenters, filters.length, isInitialized, selectedIndex, value])

  const indexAtOffset = (offset: number) => {
    let closestIndex = 0
    let closestDistance = Number.POSITIVE_INFINITY
    filterCenters.forEach((center, index) => {
      const distance = Math.abs(center - offset)
      if (distance < closestDistance) {
        closestIndex = index
        closestDistance = distance
      }
    })
    return closestIndex
  }

  const selectAtOffset = (offset: number) => {
    const nextIndex = indexAtOffset(offset)
    const nextValue = filters[nextIndex]
    if (nextValue && nextValue !== value) {
      onChange(nextValue)
      play('tick')
    }
  }

  const finishDrag = () => {
    const currentDrag = drag.current
    if (!currentDrag) return
    drag.current = null
    setIsDragging(false)
    if (!currentDrag.hasMoved) {
      if (currentDrag.startIndex !== null) {
        selectIndex(currentDrag.startIndex)
        suppressClickUntil.current = performance.now() + 100
      }
      return
    }
    suppressClickUntil.current = performance.now() + 100
    play('pop')
    const projected = clamp(tabsOffset + currentDrag.velocity * 160, -range, range)
    const nextIndex = indexAtOffset(projected)
    const nextValue = filters[nextIndex]
    if (nextValue) {
      onChange(nextValue)
      moveToIndex(nextIndex)
    }
  }

  const selectIndex = (index: number, fromFloating = false) => {
    const nextValue = filters[index]
    if (!nextValue) return
    if (nextValue !== value) play('tick')
    onChange(nextValue, fromFloating)
    moveToIndex(index)
  }

  const cancelDrag = () => {
    drag.current = null
    setIsDragging(false)
  }

  if (!filters.length) return null

  return (
    <LayoutGroup id={id}>
      <div className="w-full select-none">
        <div
          ref={rulerRef}
          aria-hidden="true"
          className="relative h-8 w-full overflow-hidden"
        >
          {tickPositions.map((position, index) => (
            <span
              key={position}
              className={`absolute top-1/2 w-px -translate-y-1/2 ${index % 5 === 0 ? 'h-3 bg-neutral-400' : 'h-2.5 bg-neutral-300'}`}
              style={{ left: position }}
            />
          ))}
          <span className="pointer-events-none absolute left-1/2 top-1/2 h-[30px] w-px -translate-x-1/2 -translate-y-1/2 bg-neutral-700" />
        </div>

        <div
          ref={filterViewportRef}
          className={`relative mx-auto mt-2 h-12 w-full max-w-full touch-pan-y overflow-hidden ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            width: '100%',
            transition: isDragging || reducedMotion || !isInitialized ? 'none' : 'width 360ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
          onPointerDown={(event) => {
            if (event.button !== 0 || !dimensions.ruler || !dimensions.viewport || !dimensions.tabs) return
            const target = event.target instanceof Element
              ? event.target.closest<HTMLButtonElement>('button[role="tab"]')
              : null
            const startIndex = target ? tabRefs.current.indexOf(target) : -1
            drag.current = {
              pointerId: event.pointerId,
              pointerX: event.clientX,
              startOffset: tabsOffset,
              startIndex: startIndex === -1 ? null : startIndex,
              lastX: event.clientX,
              lastTime: performance.now(),
              velocity: 0,
              hasMoved: false,
            }
          }}
          onPointerMove={(event) => {
            const currentDrag = drag.current
            if (!currentDrag || currentDrag.pointerId !== event.pointerId) return
            const now = performance.now()
            const elapsed = Math.max(1, now - currentDrag.lastTime)
            currentDrag.velocity = (event.clientX - currentDrag.lastX) / elapsed
            currentDrag.lastX = event.clientX
            currentDrag.lastTime = now
            if (!currentDrag.hasMoved && Math.abs(event.clientX - currentDrag.pointerX) > 4) {
              currentDrag.hasMoved = true
              setIsDragging(true)
              if (event.isTrusted) event.currentTarget.setPointerCapture(event.pointerId)
              play('press')
            }
            if (!currentDrag.hasMoved) return
            const offset = clamp(currentDrag.startOffset + event.clientX - currentDrag.pointerX, -range, range)
            setTabsOffset(offset)
            selectAtOffset(offset)
          }}
          onPointerUp={(event) => {
            if (drag.current?.pointerId !== event.pointerId) return
            finishDrag()
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId)
            }
          }}
          onPointerCancel={cancelDrag}
        >
          <div
            ref={tabsRef}
            role="tablist"
            aria-label="Project filters"
              className="absolute top-1/2 flex -translate-y-1/2"
            style={{
              left: dimensions.viewport / 2 + tabsOffset,
              width: tabsWidth,
              marginLeft: -tabsWidth / 2,
              transition: isDragging || reducedMotion || !isInitialized ? 'none' : 'left 520ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            {filters.map((filter, index) => {
              const selected = filter === value
              return (
                <button
                  key={filter}
                  ref={(element) => {
                    if (element) tabRefs.current[index] = element
                  }}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={(event) => {
                    if (event.detail !== 0 && performance.now() < suppressClickUntil.current) return
                    selectIndex(index)
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
                    event.preventDefault()
                    const direction = event.key === 'ArrowRight' ? 1 : -1
                    const nextIndex = (index + direction + filters.length) % filters.length
                    selectIndex(nextIndex)
                    tabRefs.current[nextIndex]?.focus()
                  }}
                  className={`relative z-0 grid h-10 w-[clamp(56px,6vw,104px)] shrink-0 place-items-center rounded-full px-2 text-[clamp(11px,1.1vw,18px)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-neutral-500 ${
                    selected ? 'text-neutral-900' : 'text-neutral-600'
                  }`}
                >
                  {selected && (
                    <motion.span
                      aria-hidden="true"
                      layoutId={`${id}-active-pill`}
                      transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 480, damping: 36 }}
                      className="absolute inset-0 -z-10 rounded-full border border-[#d2d2d7] bg-gradient-to-b from-white via-[#f7f7f8] to-[#ececef] shadow-[inset_0_1px_0_#fff,0_1px_4px_rgba(0,0,0,0.12)]"
                    />
                  )}
                  <span className={selected ? 'text-neutral-900' : undefined}>{filter}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showFloatingFilters && (
            <motion.div
              key="quick-project-filters"
              initial={reducedMotion ? false : { width: floatingCollapsedWidth, opacity: 0, scaleY: 0.5 }}
              animate={{ width: floatingWidth, opacity: 1, scaleY: 1 }}
              exit={{
                width: floatingCollapsedWidth,
                opacity: 0,
                scaleY: 0.5,
                transition: reducedMotion
                  ? { duration: 0 }
                  : {
                      type: 'spring',
                      stiffness: 380,
                      damping: 38,
                      opacity: { duration: 0.2, ease: 'easeOut' },
                    },
              }}
              transition={reducedMotion
                ? { duration: 0 }
                : {
                    type: 'spring',
                    stiffness: 300,
                    damping: 28,
                    mass: 0.9,
                    opacity: { duration: 0.16, ease: 'easeOut' },
                  }}
              onFocusCapture={() => {
                floatingHasFocus.current = true
                updateFloatingVisibility.current()
              }}
              onBlurCapture={(event) => {
                if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return
                floatingHasFocus.current = false
                updateFloatingVisibility.current()
              }}
              className="fixed left-1/2 top-4 z-[60] h-10 max-w-[calc(100vw-16px)] -translate-x-1/2 overflow-hidden rounded-full border border-black/10 bg-white/85 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl"
            >
              <div
                role="tablist"
                aria-label="Quick project filters"
                className="absolute left-1/2 top-1/2 flex h-8 -translate-x-1/2 -translate-y-1/2 items-center gap-1"
                style={{ width: `${floatingWidth - FLOATING_FILTERS_PADDING * 2}px` }}
              >
                {floatingFilters.map((filter, index) => {
                  const selected = filter === value
                  return (
                    <button
                      key={filter}
                      ref={(element) => {
                        if (element) floatingTabRefs.current[index] = element
                      }}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => selectIndex(filters.indexOf(filter), true)}
                      onKeyDown={(event) => {
                        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
                        event.preventDefault()
                        const direction = event.key === 'ArrowRight' ? 1 : -1
                        const nextIndex = (index + direction + floatingFilters.length) % floatingFilters.length
                        selectIndex(filters.indexOf(floatingFilters[nextIndex]), true)
                        floatingTabRefs.current[nextIndex]?.focus()
                      }}
                      className={`relative grid h-8 min-w-0 flex-1 shrink-0 place-items-center rounded-full border px-1 text-[clamp(11px,2.8vw,14px)] transition-[background-color,border-color,box-shadow,color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-600 ${
                        selected
                          ? 'border-black/10 bg-white text-[#1d1d1f] shadow-[0_1px_4px_rgba(0,0,0,0.16),inset_0_1px_0_#fff]'
                          : 'border-transparent bg-transparent text-neutral-600 hover:bg-black/[0.045] hover:text-neutral-900'
                      }`}
                    >
                      {filter}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </LayoutGroup>
  )
}
