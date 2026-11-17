import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, RefreshCw, WifiOff } from 'lucide-react'

type TrackedMedia = HTMLImageElement | HTMLVideoElement

function isTrackedMedia(target: EventTarget | Node | null): target is TrackedMedia {
  return target instanceof HTMLImageElement || target instanceof HTMLVideoElement
}

function mediaSource(media: TrackedMedia) {
  if (media instanceof HTMLImageElement && media.getAttribute('srcset')) {
    return media.currentSrc || media.getAttribute('srcset') || media.getAttribute('src')
  }
  return media.getAttribute('src') || media.currentSrc || media.getAttribute('srcset')
}

function retryUrl(source: string, attempt: number) {
  try {
    const url = new URL(source, window.location.href)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    url.searchParams.set('_assetRetry', String(attempt))
    return url.toString()
  } catch {
    return null
  }
}

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine)
  const [failedCount, setFailedCount] = useState(0)
  const [retrying, setRetrying] = useState(false)
  const [reconnected, setReconnected] = useState(false)
  const retryRef = useRef<() => void>(() => {})

  useEffect(() => {
    const failedMedia = new Set<TrackedMedia>()
    const interruptedMedia = new Set<TrackedMedia>()
    const retryingMedia = new Set<TrackedMedia>()
    const retryCounts = new WeakMap<TrackedMedia, number>()
    let reconnectTimer: number | undefined
    let visibilityObserver: IntersectionObserver | undefined

    const syncCounts = () => {
      setFailedCount(failedMedia.size)
      setRetrying(retryingMedia.size > 0)
    }

    const markFailed = (media: TrackedMedia) => {
      retryingMedia.delete(media)
      if (navigator.onLine) {
        media.dataset.mediaState = 'error'
        interruptedMedia.delete(media)
      } else {
        media.dataset.mediaState = 'offline'
        interruptedMedia.add(media)
      }
      failedMedia.add(media)
      syncCounts()
    }

    const markLoaded = (media: TrackedMedia) => {
      media.dataset.mediaState = 'loaded'
      failedMedia.delete(media)
      interruptedMedia.delete(media)
      retryingMedia.delete(media)
      syncCounts()
    }

    const retryMedia = () => {
      if (!navigator.onLine || retryingMedia.size > 0) return

      const candidates = new Set([...failedMedia, ...interruptedMedia])
      failedMedia.clear()
      interruptedMedia.clear()

      for (const media of candidates) {
        const source = mediaSource(media)
        if (!source) {
          failedMedia.add(media)
          continue
        }

        const attempt = (retryCounts.get(media) ?? 0) + 1
        retryCounts.set(media, attempt)
        const nextSource = retryUrl(source, attempt)
        if (!nextSource) {
          failedMedia.add(media)
          continue
        }
        retryingMedia.add(media)
        media.dataset.mediaSource = nextSource
        markLoading(media)
        if (media instanceof HTMLImageElement && media.srcset) {
          const nextSrcset = media.srcset.split(',').map((candidate) => {
            const [candidateUrl, ...descriptors] = candidate.trim().split(/\s+/)
            const nextCandidate = retryUrl(candidateUrl, attempt)
            return nextCandidate ? [nextCandidate, ...descriptors].join(' ') : candidate
          }).join(', ')
          media.setAttribute('srcset', nextSrcset)
          if (media.getAttribute('src')) {
            const fallbackSource = retryUrl(media.getAttribute('src') ?? '', attempt)
            if (fallbackSource) media.setAttribute('src', fallbackSource)
          }
        } else {
          media.setAttribute('src', nextSource)
        }
        if (media instanceof HTMLVideoElement) media.load()
      }

      syncCounts()
    }

    const markLoading = (media: TrackedMedia) => {
      media.dataset.mediaState = 'loading'
    }

    retryRef.current = retryMedia

    const trackMedia = (media: TrackedMedia, force = false) => {
      const source = mediaSource(media)
      if (!source) return
      if (!force && media.dataset.mediaSource === source) {
        if (media.dataset.mediaState === 'error' || media.dataset.mediaState === 'offline') {
          failedMedia.add(media)
          if (media.dataset.mediaState === 'offline') interruptedMedia.add(media)
          syncCounts()
        } else if (media.dataset.mediaState === 'idle') {
          visibilityObserver?.observe(media)
        }
        return
      }
      media.dataset.mediaSource = source

      if (retryingMedia.has(media)) {
        markLoading(media)
        return
      }

      if (media instanceof HTMLImageElement) {
        if (media.complete) {
          if (media.naturalWidth > 0) markLoaded(media)
          else markFailed(media)
          return
        }

        if (media.loading === 'lazy' && visibilityObserver) {
          media.dataset.mediaState = 'idle'
          visibilityObserver?.observe(media)
          return
        }
      } else if (media.error) {
        markFailed(media)
        return
      } else if (media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        markLoaded(media)
        return
      }

      if (navigator.onLine) {
        markLoading(media)
      } else {
        media.dataset.mediaState = 'offline'
        interruptedMedia.add(media)
      }
    }

    const scanMedia = (root: ParentNode) => {
      if (isTrackedMedia(root)) trackMedia(root)
      root.querySelectorAll('img, video').forEach((element) => {
        if (isTrackedMedia(element)) trackMedia(element)
      })
    }

    const releaseMedia = (media: TrackedMedia) => {
      const failed = failedMedia.delete(media)
      const interrupted = interruptedMedia.delete(media)
      const retrying = retryingMedia.delete(media)
      const changed = failed || interrupted || retrying
      if (changed) syncCounts()
    }

    const releaseTree = (root: ParentNode) => {
      if (isTrackedMedia(root)) releaseMedia(root)
      root.querySelectorAll('img, video').forEach((element) => {
        if (isTrackedMedia(element)) releaseMedia(element)
      })
    }

    const onMediaLoad = (event: Event) => {
      if (isTrackedMedia(event.target)) markLoaded(event.target)
    }

    const onMediaError = (event: Event) => {
      if (isTrackedMedia(event.target)) markFailed(event.target)
    }

    if (typeof IntersectionObserver !== 'undefined') {
      visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || !isTrackedMedia(entry.target)) return
          visibilityObserver?.unobserve(entry.target)
          if (navigator.onLine) markLoading(entry.target)
          else {
            entry.target.dataset.mediaState = 'offline'
            interruptedMedia.add(entry.target)
          }
        })
      }, { rootMargin: '160px' })
    }

    const mediaObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type === 'attributes' && isTrackedMedia(record.target)) {
          trackMedia(record.target, true)
          return
        }
        record.removedNodes.forEach((node) => {
          if (node instanceof Element || node instanceof DocumentFragment) releaseTree(node)
        })
        record.addedNodes.forEach((node) => {
          if (node instanceof Element || node instanceof DocumentFragment) scanMedia(node)
        })
      })
    })

    const onOffline = () => {
      setIsOnline(false)
      setReconnected(false)
      window.clearTimeout(reconnectTimer)
      retryingMedia.clear()
      syncCounts()
      document.querySelectorAll<TrackedMedia>('img[data-media-state="loading"], video[data-media-state="loading"]').forEach((media) => {
        media.dataset.mediaState = 'offline'
        interruptedMedia.add(media)
      })
      failedMedia.forEach((media) => {
        media.dataset.mediaState = 'offline'
      })
    }

    const onOnline = () => {
      setIsOnline(true)
      setReconnected(true)
      window.clearTimeout(reconnectTimer)
      reconnectTimer = window.setTimeout(() => setReconnected(false), 2800)
      retryMedia()
    }

    document.addEventListener('load', onMediaLoad, true)
    document.addEventListener('loadeddata', onMediaLoad, true)
    document.addEventListener('loadedmetadata', onMediaLoad, true)
    document.addEventListener('error', onMediaError, true)
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)

    scanMedia(document)
    mediaObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['src', 'srcset'],
      childList: true,
      subtree: true,
    })

    document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((image) => {
      if (image.dataset.mediaState === 'idle') visibilityObserver?.observe(image)
    })

    return () => {
      retryRef.current = () => {}
      window.clearTimeout(reconnectTimer)
      document.removeEventListener('load', onMediaLoad, true)
      document.removeEventListener('loadeddata', onMediaLoad, true)
      document.removeEventListener('loadedmetadata', onMediaLoad, true)
      document.removeEventListener('error', onMediaError, true)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
      mediaObserver.disconnect()
      visibilityObserver?.disconnect()
    }
  }, [])

  const showNotice = !isOnline || failedCount > 0 || retrying || reconnected
  if (!showNotice) return null

  const message = !isOnline
    ? 'You’re offline. Some media may be unavailable.'
    : retrying
      ? 'Retrying media…'
      : failedCount > 0
        ? 'Some media couldn’t load.'
        : 'Connection restored.'

  return (
    <div className="network-status" role="status" aria-live="polite">
      <span className="network-status__icon" aria-hidden="true">
        {!isOnline
          ? <WifiOff size={16} />
          : retrying
            ? <RefreshCw size={16} />
            : failedCount > 0
              ? <AlertCircle size={16} />
              : <Check size={16} />}
      </span>
      <span className="network-status__message">{message}</span>
      {isOnline && failedCount > 0 && (
        <button
          className="network-status__retry"
          type="button"
          onClick={() => retryRef.current()}
          disabled={retrying}
        >
          <RefreshCw size={13} aria-hidden="true" />
          <span>Retry</span>
        </button>
      )}
    </div>
  )
}
