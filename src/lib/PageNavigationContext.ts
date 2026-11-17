import { createContext, useContext } from 'react'

export type CurtainPalette = readonly string[]

export type PageNavigation = {
  navigate: (hash: string, palette?: CurtainPalette) => void
  prefetch: (hash: string) => void
}

const PageNavigationContext = createContext<PageNavigation | null>(null)

export function usePageNavigation() {
  const navigation = useContext(PageNavigationContext)
  if (!navigation) throw new Error('usePageNavigation must be used within the page navigation provider')
  return navigation
}

export { PageNavigationContext }
