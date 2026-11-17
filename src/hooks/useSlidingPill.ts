import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

type Position = {
  left: number
  width: number
}

export function useSlidingPill(activeId: string) {
  const navRef = useRef<HTMLElement>(null)
  const tabsRef = useRef(new Map<string, HTMLElement>())
  const [position, setPosition] = useState<Position>({ left: 0, width: 0 })

  const updatePosition = useCallback(() => {
    const activeTab = tabsRef.current.get(activeId)
    if (!activeTab) return

    const nextPosition = { left: activeTab.offsetLeft, width: activeTab.offsetWidth }
    setPosition((previous) => (
      previous.left === nextPosition.left && previous.width === nextPosition.width
        ? previous
        : nextPosition
    ))
  }, [activeId])

  const setTabRef = useCallback((id: string) => (element: HTMLElement | null) => {
    if (element) tabsRef.current.set(id, element)
    else tabsRef.current.delete(id)
  }, [])

  useLayoutEffect(() => {
    updatePosition()
  }, [updatePosition])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const observer = new ResizeObserver(updatePosition)
    observer.observe(nav)
    const activeTab = tabsRef.current.get(activeId)
    if (activeTab) observer.observe(activeTab)

    return () => observer.disconnect()
  }, [activeId, updatePosition])

  return {
    navRef,
    setTabRef,
    pillStyle: {
      width: position.width,
      transform: `translateX(${position.left}px)`,
    },
  }
}
