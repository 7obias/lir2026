import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { isDeliberateTap } from './useLikedPerformances'

type SearchPointer = {
  performanceId: string
  artist: string
  x: number
  y: number
  valid: boolean
}

export const artistImageSearchUrl = (artist: string) => (
  `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${artist.trim()} DJ`)}`
)

export const artistImageSearchLinkAttributes = (artist: string) => ({
  href: artistImageSearchUrl(artist),
  target: '_blank',
  rel: 'noopener noreferrer',
  referrerPolicy: 'no-referrer',
} as const)

export function openArtistImageSearch(artist: string, ownerDocument: Document = document) {
  const link = ownerDocument.createElement('a')
  const attributes = artistImageSearchLinkAttributes(artist)
  link.href = attributes.href
  link.target = attributes.target
  link.rel = attributes.rel
  link.referrerPolicy = attributes.referrerPolicy
  link.setAttribute('aria-hidden', 'true')
  link.style.position = 'fixed'
  link.style.width = '1px'
  link.style.height = '1px'
  link.style.opacity = '0'
  link.style.pointerEvents = 'none'
  ownerDocument.body.append(link)
  link.click()
  link.remove()
}

export function useArtistSearchMode(shouldSuppressTap: () => boolean) {
  const [artistSearchMode, setArtistSearchMode] = useState(false)
  const pointersRef = useRef(new Map<number, SearchPointer>())

  const activateArtistSearchMode = () => {
    pointersRef.current.clear()
    setArtistSearchMode(true)
  }

  const deactivateArtistSearchMode = () => {
    pointersRef.current.clear()
    setArtistSearchMode(false)
  }

  const onPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    performanceId: string,
    artist: string,
  ) => {
    if (!artistSearchMode) return
    pointersRef.current.set(event.pointerId, {
      performanceId,
      artist,
      x: event.clientX,
      y: event.clientY,
      valid: true,
    })
    if (pointersRef.current.size > 1) {
      pointersRef.current.forEach((pointer) => {
        pointer.valid = false
      })
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const pointer = pointersRef.current.get(event.pointerId)
    if (!pointer) return
    if (!isDeliberateTap(pointer.x, pointer.y, event.clientX, event.clientY)) pointer.valid = false
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const pointer = pointersRef.current.get(event.pointerId)
    pointersRef.current.delete(event.pointerId)
    if (
      !pointer?.valid
      || pointersRef.current.size > 0
      || shouldSuppressTap()
      || !isDeliberateTap(pointer.x, pointer.y, event.clientX, event.clientY)
    ) return

    const releasedCard = document.elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-performance-id]')
    if (releasedCard?.dataset.performanceId !== pointer.performanceId) return

    event.preventDefault()
    event.stopPropagation()
    openArtistImageSearch(pointer.artist, event.currentTarget.ownerDocument)
  }

  const onPointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    pointersRef.current.delete(event.pointerId)
  }

  return {
    artistSearchMode,
    activateArtistSearchMode,
    deactivateArtistSearchMode,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  }
}
