import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string
  rootMargin?: string
}

export function DeferredImage({ src, rootMargin = '200px', ...props }: Props) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [shouldLoad, setShouldLoad] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (shouldLoad) return
    const image = imageRef.current
    if (!image) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setShouldLoad(true)
      observer.disconnect()
    }, { rootMargin })
    observer.observe(image)
    return () => observer.disconnect()
  }, [rootMargin, shouldLoad])

  return (
    <img
      {...props}
      ref={imageRef}
      src={shouldLoad ? src : undefined}
      loading="lazy"
      decoding={props.decoding ?? 'async'}
    />
  )
}
