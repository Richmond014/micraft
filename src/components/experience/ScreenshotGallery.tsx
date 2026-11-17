import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { getResponsiveImageSrcSet } from '../../lib/assets'
import { DeferredImage } from '../ui/DeferredImage'

type Props = { screenshots: string[] }

const SPEED = 40 // px per second, constant regardless of image count

export function ScreenshotGallery({ screenshots }: Props) {
  const reduced = useReducedMotion()
  const galleryRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true)
  const [settled, setSettled] = useState(0) // images loaded (or failed)
  const [groupWidth, setGroupWidth] = useState(0)
  const [galleryWidth, setGalleryWidth] = useState(0)

  const allLoaded = settled >= screenshots.length
  const overflowing = groupWidth > galleryWidth + 1
  const shouldAnimate = !reduced && allLoaded && overflowing

  useEffect(() => {
    setSettled(0)
  }, [screenshots])

  useEffect(() => {
    const gallery = galleryRef.current
    if (!gallery || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '100px',
    })
    observer.observe(gallery)
    return () => observer.disconnect()
  }, [screenshots.length])

  useEffect(() => {
    const gallery = galleryRef.current
    const group = groupRef.current
    if (!gallery || !group) return
    const measure = () => {
      setGalleryWidth(gallery.clientWidth)
      setGroupWidth(group.offsetWidth)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(gallery)
    observer.observe(group)
    return () => observer.disconnect()
  }, [screenshots.length])

  if (screenshots.length === 0) return null

  const markSettled = () => setSettled((n) => n + 1)

  const renderImages = (duplicate: boolean) =>
    screenshots.map((src, index) => {
      const sizes = src.endsWith('/imgRectangle24.png')
        ? '144px'
        : src.endsWith('/imgRectangle25.png')
          ? '226px'
          : src.endsWith('/imgRectangle29.png')
            ? '105px'
            : '240px'

      return (
        <DeferredImage
          key={`${duplicate ? 'dup' : 'main'}-${src}-${index}`}
          src={src}
          srcSet={getResponsiveImageSrcSet(src, [400, 800])}
          sizes={sizes}
          alt={duplicate ? '' : `Experience photo ${index + 1}`}
          aria-hidden={duplicate || undefined}
          draggable={false}
          onLoad={duplicate ? undefined : markSettled}
          onError={duplicate ? undefined : markSettled}
          className="h-full w-auto max-w-none shrink-0 rounded-[9px] object-contain"
          rootMargin="200px"
        />
      )
    })

  return (
    <div
      ref={galleryRef}
      role="region"
      aria-label="Experience photos"
      className="h-[144px] w-full max-w-[24rem] overflow-hidden"
    >
      <style>{`
        @keyframes gallery-marquee {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>

      {/* Two identical groups, each with trailing gap: translating by exactly -50%
          lands on a pixel-identical frame, so the loop has no seam. */}
      <div
        className="flex h-full w-max"
        style={{
          willChange: shouldAnimate ? 'transform' : undefined,
          animation: shouldAnimate
            ? `gallery-marquee ${groupWidth / SPEED}s linear infinite`
            : 'none',
          animationPlayState: inView ? 'running' : 'paused',
        }}
      >
        <div ref={groupRef} className="flex h-full shrink-0 gap-3 pr-3">
          {renderImages(false)}
        </div>
        {shouldAnimate && (
          <div className="flex h-full shrink-0 gap-3 pr-3" aria-hidden>
            {renderImages(true)}
          </div>
        )}
      </div>
    </div>
  )
}