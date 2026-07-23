import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { toggleSetMembership } from './timetable'

const STORAGE_KEY = 'lir2026:liked-performance-ids'
const LEGACY_STORAGE_KEY = 'lir2026:marked-performance-ids'
const MOVE_TOLERANCE_PX = 10

export function readLikedPerformanceIds(
  storage: Pick<Storage, 'getItem'> | undefined,
  knownIds: ReadonlySet<string>,
): Set<string> {
  if (!storage) return new Set()
  try {
    const storedValue = storage.getItem(STORAGE_KEY) ?? storage.getItem(LEGACY_STORAGE_KEY) ?? '[]'
    const value: unknown = JSON.parse(storedValue)
    if (!Array.isArray(value)) return new Set()
    return new Set(value.filter((id): id is string => typeof id === 'string' && knownIds.has(id)))
  } catch {
    return new Set()
  }
}

export function isDeliberateTap(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): boolean {
  return Math.hypot(endX - startX, endY - startY) < MOVE_TOLERANCE_PX
}

function getBrowserStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

type ActivePointer = {
  performanceId: string
  x: number
  y: number
  valid: boolean
  likeModeAtStart: boolean
}

export function useLikedPerformances(
  knownIds: ReadonlySet<string>,
  shouldSuppressTap: () => boolean,
) {
  const [likeMode, setLikeMode] = useState(false)
  const [likedIds, setLikedIds] = useState<Set<string>>(() =>
    readLikedPerformanceIds(getBrowserStorage(), knownIds),
  )
  const pointersRef = useRef(new Map<number, ActivePointer>())

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...likedIds].sort()))
    } catch {
      // Liking still works for this session when browser storage is unavailable.
    }
  }, [likedIds])

  const toggleLikeMode = () => {
    pointersRef.current.clear()
    setLikeMode((active) => !active)
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, performanceId: string) => {
    if (!likeMode) return
    pointersRef.current.set(event.pointerId, {
      performanceId,
      x: event.clientX,
      y: event.clientY,
      valid: true,
      likeModeAtStart: true,
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
      || !pointer.likeModeAtStart
      || pointersRef.current.size > 0
      || shouldSuppressTap()
      || !isDeliberateTap(pointer.x, pointer.y, event.clientX, event.clientY)
    ) return

    const releasedCard = document.elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-performance-id]')
    if (releasedCard?.dataset.performanceId !== pointer.performanceId) return

    event.preventDefault()
    event.stopPropagation()
    setLikedIds((current) => toggleSetMembership(current, pointer.performanceId))
  }

  const onPointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    pointersRef.current.delete(event.pointerId)
  }

  const toggleLiked = (performanceId: string) => {
    setLikedIds((current) => toggleSetMembership(current, performanceId))
  }

  return {
    likeMode,
    likedIds,
    toggleLikeMode,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    toggleLiked,
  }
}
