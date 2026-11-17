import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react'

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
  ...props
}: Props) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [shouldLoad, setShouldLoad] = useState(() => priority || typeof IntersectionObserver === 'undefined')
  const isReady = priority || shouldLoad

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

  return (
    <img
      {...props}
      ref={imageRef}
      loading={isReady ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={props.decoding ?? 'async'}
      srcSet={isReady ? srcSet : undefined}
      src={isReady ? src : undefined}
    />
  )
}
