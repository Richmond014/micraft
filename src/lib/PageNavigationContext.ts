import { createContext, useContext } from 'react'

export type CurtainPalette = readonly string[]

type PageNavigation = (hash: string, palette?: CurtainPalette) => void

const PageNavigationContext = createContext<PageNavigation | null>(null)

export function usePageNavigation() {
  const navigate = useContext(PageNavigationContext)
  if (!navigate) throw new Error('usePageNavigation must be used within the page navigation provider')
  return navigate
}

export { PageNavigationContext }
