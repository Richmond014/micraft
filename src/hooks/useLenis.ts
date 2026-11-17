import { useEffect } from 'react'
import Lenis from 'lenis'
import { setLenis } from '../lib/scroll'

export function useLenis() {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let lenis: Lenis | undefined

    const syncWithMotionPreference = () => {
      if (reducedMotion.matches) {
        lenis?.destroy()
        lenis = undefined
        setLenis(undefined)
        return
      }

      if (!lenis) {
        lenis = new Lenis({ autoRaf: true })
        setLenis(lenis)
      }
    }

    syncWithMotionPreference()
    reducedMotion.addEventListener('change', syncWithMotionPreference)

    return () => {
      reducedMotion.removeEventListener('change', syncWithMotionPreference)
      lenis?.destroy()
      setLenis(undefined)
    }
  }, [])
}