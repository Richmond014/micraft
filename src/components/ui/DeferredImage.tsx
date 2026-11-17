import { useEffect, useRef, useState, type ImgHTMLAttributes, type SyntheticEvent } from 'react'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'loading' | 'fetchPriority'> & {
  src: string
  srcSet?: string
  rootMargin?: string
  priority?: boolean
}

export function DeferredImage({
  src,
  srcSet,
  rootMargin = '200px',
  priority = false,
  onError,
  ...props
}: Props) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [shouldLoad, setShouldLoad] = useState(() => priority || typeof IntersectionObserver === 'undefined')
  const [fallbackSourceKey, setFallbackSourceKey] = useState<string | null>(null)
  const isReady = priority || shouldLoad
  const sourceKey = `${src}\u0000${srcSet ?? ''}`
  const usingOriginalSource = fallbackSourceKey === sourceKey

  useEffect(() => {
    if (priority || shouldLoad) return
    const image = imageRef.current
    if (!image) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setShouldLoad(true)
      observer.disconnect()
    }, { rootMargin })
    observer.observe(image)
    return () => observer.disconnect()
  }, [priority, rootMargin, shouldLoad])

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    if (isReady && srcSet && !usingOriginalSource) {
      setFallbackSourceKey(sourceKey)
      return
    }

    if (onError) {
      onError(event)
      return
    }

    console.error(`Unable to load image "${src}".`)
  }

  return (
    <img
      {...props}
      ref={imageRef}
      loading={isReady ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={props.decoding ?? 'async'}
      onError={handleError}
      srcSet={isReady && !usingOriginalSource ? srcSet : undefined}
      src={isReady ? src : undefined}
    />
  )
}
