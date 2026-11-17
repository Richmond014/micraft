import { useCallback, useEffect, useRef, useState } from 'react'

/** A short-lived message: auto-dismisses, Escape dismisses, repeat calls restart it. */
export function useTransientNote<T>(duration = 2400) {
  const [note, setNote] = useState<{ value: T; n: number } | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current)
    setNote(null)
  }, [])

  const show = useCallback(
    (value: T) => {
      window.clearTimeout(timer.current)
      setNote((prev) => ({ value, n: (prev?.n ?? 0) + 1 }))
      timer.current = window.setTimeout(() => setNote(null), duration)
    },
    [duration],
  )

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    if (!note) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [note, dismiss])

  return { note, show, dismiss }
}
