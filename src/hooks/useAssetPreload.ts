import { useEffect, useState } from 'react'

type PreloadState = {
  key: string
  done: boolean
  progress: number
  failed: string[]
}

export function useAssetPreload(urls: readonly string[]) {
  const key = JSON.stringify(urls)
  const empty = urls.length === 0
  const [state, setState] = useState<PreloadState>({
    key,
    done: empty,
    progress: empty ? 1 : 0,
    failed: [],
  })
  const visibleState = state.key === key
    ? state
    : { key, done: empty, progress: empty ? 1 : 0, failed: [] }

  useEffect(() => {
    if (urls.length === 0) return

    let cancelled = false
    let settled = 0
    const failed: string[] = []

    urls.forEach((url) => {
      const image = new Image()
      const settle = (loaded: boolean) => {
        if (image.onload === null && image.onerror === null) return
        image.onload = null
        image.onerror = null
        if (!loaded) {
          failed.push(url)
        }
        if (cancelled) return
        settled += 1
        setState({
          key,
          done: settled === urls.length,
          progress: settled / urls.length,
          failed: [...failed],
        })
      }

      image.onload = () => settle(true)
      image.onerror = () => settle(false)
      image.src = url

      if (image.complete) settle(image.naturalWidth > 0)
    })

    return () => {
      cancelled = true
    }
  }, [key, urls])

  return visibleState
}