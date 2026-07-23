import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { toggleSetMembership } from './timetable'

const STORAGE_KEY = 'lir2026:marked-performance-ids'
const TAP_WINDOW_MS = 700
const TAP_RADIUS_PX = 28
const MOVE_TOLERANCE_PX = 10

export type TapSequence = {
  performanceId: string
  pointerType: string
  count: number
  startedAt: number
  lastTapAt: number
  x: number
  y: number
}

type Tap = {
  performanceId: string
  pointerType: string
  time: number
  x: number
  y: number
}

export function advanceTapSequence(
  previous: TapSequence | undefined,
  tap: Tap,
): { next: TapSequence | undefined; triggered: boolean } {
  const continues = previous?.performanceId === tap.performanceId
    && previous.pointerType === tap.pointerType
    && tap.time - previous.startedAt <= TAP_WINDOW_MS
    && Math.hypot(tap.x - previous.x, tap.y - previous.y) <= TAP_RADIUS_PX
  const count = continues ? previous.count + 1 : 1

  if (count === 3) return { next: undefined, triggered: true }
  return {
    next: {
      performanceId: tap.performanceId,
      pointerType: tap.pointerType,
      count,
      startedAt: continues ? previous.startedAt : tap.time,
      lastTapAt: tap.time,
      x: tap.x,
      y: tap.y,
    },
    triggered: false,
  }
}

export function readMarkedPerformanceIds(
  storage: Pick<Storage, 'getItem'> | undefined,
  knownIds: ReadonlySet<string>,
): Set<string> {
  if (!storage) return new Set()
  try {
    const value: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(value)) return new Set()
    return new Set(value.filter((id): id is string => typeof id === 'string' && knownIds.has(id)))
  } catch {
    return new Set()
  }
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
  pointerType: string
  x: number
  y: number
  valid: boolean
}

export function useMarkedPerformances(
  knownIds: ReadonlySet<string>,
  shouldSuppressTap: () => boolean,
) {
  const [markedIds, setMarkedIds] = useState<Set<string>>(() =>
    readMarkedPerformanceIds(getBrowserStorage(), knownIds),
  )
  const pointersRef = useRef(new Map<number, ActivePointer>())
  const tapSequenceRef = useRef<TapSequence | undefined>(undefined)
  const sequenceTimerRef = useRef<number | undefined>(undefined)
  const [tapFeedback, setTapFeedback] = useState<{ performanceId: string; count: 1 | 2 }>()

  const cancelSequence = () => {
    tapSequenceRef.current = undefined
    setTapFeedback(undefined)
    if (sequenceTimerRef.current !== undefined) window.clearTimeout(sequenceTimerRef.current)
    sequenceTimerRef.current = undefined
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...markedIds].sort()))
    } catch {
      // Marking still works for this session when browser storage is unavailable.
    }
  }, [markedIds])

  useEffect(() => () => {
    if (sequenceTimerRef.current !== undefined) window.clearTimeout(sequenceTimerRef.current)
  }, [])

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, performanceId: string) => {
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture is an enhancement; pointer cancellation still protects scrolling.
    }
    pointersRef.current.set(event.pointerId, {
      performanceId,
      pointerType: event.pointerType,
      x: event.clientX,
      y: event.clientY,
      valid: true,
    })
    if (pointersRef.current.size > 1) {
      cancelSequence()
      pointersRef.current.forEach((pointer) => {
        pointer.valid = false
      })
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const pointer = pointersRef.current.get(event.pointerId)
    if (!pointer) return
    if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > MOVE_TOLERANCE_PX) {
      pointer.valid = false
      cancelSequence()
    }
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const pointer = pointersRef.current.get(event.pointerId)
    pointersRef.current.delete(event.pointerId)
    if (!pointer?.valid || pointersRef.current.size > 0 || shouldSuppressTap()) {
      cancelSequence()
      return
    }

    const result = advanceTapSequence(tapSequenceRef.current, {
      performanceId: pointer.performanceId,
      pointerType: pointer.pointerType,
      time: Date.now(),
      x: event.clientX,
      y: event.clientY,
    })
    tapSequenceRef.current = result.next
    if (result.triggered) {
      event.preventDefault()
      event.stopPropagation()
      setTapFeedback(undefined)
      setMarkedIds((current) => toggleSetMembership(current, pointer.performanceId))
      if (sequenceTimerRef.current !== undefined) window.clearTimeout(sequenceTimerRef.current)
      sequenceTimerRef.current = undefined
    } else if (result.next) {
      setTapFeedback({
        performanceId: result.next.performanceId,
        count: result.next.count as 1 | 2,
      })
      if (sequenceTimerRef.current !== undefined) window.clearTimeout(sequenceTimerRef.current)
      const remainingTime = Math.max(0, TAP_WINDOW_MS - (Date.now() - result.next.startedAt))
      sequenceTimerRef.current = window.setTimeout(cancelSequence, remainingTime)
    }
  }

  const onPointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    pointersRef.current.delete(event.pointerId)
    cancelSequence()
  }

  const toggleMarked = (performanceId: string) => {
    setMarkedIds((current) => toggleSetMembership(current, performanceId))
  }

  return {
    markedIds,
    tapFeedback,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    toggleMarked,
  }
}
