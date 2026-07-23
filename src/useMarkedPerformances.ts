import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { toggleSetMembership } from './timetable'

const STORAGE_KEY = 'lir2026:marked-performance-ids'
const TAP_WINDOW_MS = 650
const TAP_RADIUS_PX = 28
const MOVE_TOLERANCE_PX = 10

export type TapSequence = {
  performanceId: string
  count: number
  time: number
  x: number
  y: number
}

type Tap = Omit<TapSequence, 'count'>

export function advanceTapSequence(
  previous: TapSequence | undefined,
  tap: Tap,
): { next: TapSequence | undefined; triggered: boolean } {
  const continues = previous?.performanceId === tap.performanceId
    && tap.time - previous.time <= TAP_WINDOW_MS
    && Math.hypot(tap.x - previous.x, tap.y - previous.y) <= TAP_RADIUS_PX
  const count = continues ? previous.count + 1 : 1

  if (count === 3) return { next: undefined, triggered: true }
  return { next: { ...tap, count }, triggered: false }
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

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...markedIds].sort()))
    } catch {
      // Marking still works for this session when browser storage is unavailable.
    }
  }, [markedIds])

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, performanceId: string) => {
    pointersRef.current.set(event.pointerId, {
      performanceId,
      x: event.clientX,
      y: event.clientY,
      valid: true,
    })
    if (pointersRef.current.size > 1) {
      tapSequenceRef.current = undefined
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
    }
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const pointer = pointersRef.current.get(event.pointerId)
    pointersRef.current.delete(event.pointerId)
    if (!pointer?.valid || pointersRef.current.size > 0 || shouldSuppressTap()) {
      tapSequenceRef.current = undefined
      return
    }

    const result = advanceTapSequence(tapSequenceRef.current, {
      performanceId: pointer.performanceId,
      time: Date.now(),
      x: event.clientX,
      y: event.clientY,
    })
    tapSequenceRef.current = result.next
    if (result.triggered) {
      event.preventDefault()
      setMarkedIds((current) => toggleSetMembership(current, pointer.performanceId))
    }
  }

  const onPointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    pointersRef.current.delete(event.pointerId)
    tapSequenceRef.current = undefined
  }

  const toggleMarked = (performanceId: string) => {
    setMarkedIds((current) => toggleSetMembership(current, performanceId))
  }

  return { markedIds, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, toggleMarked }
}
