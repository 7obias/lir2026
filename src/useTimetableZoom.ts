import { useEffect, useRef, useState, type RefObject } from 'react'
import { STAGE_HEADER_HEIGHT, TIME_COLUMN_WIDTH } from './timetable'

export type TimetableZoomState = {
  scale: number
}

export const MIN_TIMETABLE_SCALE = 1
export const MAX_TIMETABLE_SCALE = 2.5

export function clampZoomScale(scale: number): number {
  return Math.min(MAX_TIMETABLE_SCALE, Math.max(MIN_TIMETABLE_SCALE, scale))
}

export function zoomFromDistances(startScale: number, startDistance: number, currentDistance: number): number {
  if (startDistance <= 0) return clampZoomScale(startScale)
  return clampZoomScale(startScale * currentDistance / startDistance)
}

export function anchoredScrollOffset(
  contentFocalPoint: number,
  viewportFocalPoint: number,
  fixedInset: number,
  scalableRatio: number,
): number {
  const scalableFocalPoint = Math.max(0, contentFocalPoint - fixedInset)
  return Math.max(0, fixedInset + scalableFocalPoint * scalableRatio - viewportFocalPoint)
}

const touchDistance = (first: Touch, second: Touch) =>
  Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY)

const touchMidpoint = (first: Touch, second: Touch) => ({
  x: (first.clientX + second.clientX) / 2,
  y: (first.clientY + second.clientY) / 2,
})

type Gesture = {
  startDistance: number
  startScale: number
  contentX: number
  contentY: number
  bodyWidth: number
}

export function useTimetableZoom(
  bodyRef: RefObject<HTMLDivElement | null>,
  scrollerRef: RefObject<HTMLDivElement | null>,
) {
  const [zoom, setZoom] = useState<TimetableZoomState>({ scale: 1 })
  const gestureRef = useRef<Gesture | undefined>(undefined)
  const scaleRef = useRef(zoom.scale)
  scaleRef.current = zoom.scale

  useEffect(() => {
    const body = bodyRef.current
    const scroller = scrollerRef.current
    if (!body || !scroller) return

    const start = (event: TouchEvent) => {
      if (event.touches.length !== 2) return
      event.preventDefault()
      const midpoint = touchMidpoint(event.touches[0], event.touches[1])
      const rect = scroller.getBoundingClientRect()
      gestureRef.current = {
        startDistance: touchDistance(event.touches[0], event.touches[1]),
        startScale: scaleRef.current,
        contentX: scroller.scrollLeft + midpoint.x - rect.left,
        contentY: scroller.scrollTop + midpoint.y - rect.top,
        bodyWidth: body.getBoundingClientRect().width,
      }
    }

    const move = (event: TouchEvent) => {
      const gesture = gestureRef.current
      if (!gesture || event.touches.length !== 2) return
      event.preventDefault()
      const midpoint = touchMidpoint(event.touches[0], event.touches[1])
      const rect = scroller.getBoundingClientRect()
      const nextScale = zoomFromDistances(
        gesture.startScale,
        gesture.startDistance,
        touchDistance(event.touches[0], event.touches[1]),
      )
      const ratio = nextScale / gesture.startScale
      const localX = midpoint.x - rect.left
      const localY = midpoint.y - rect.top
      const stageRatio = (gesture.bodyWidth * ratio - TIME_COLUMN_WIDTH) / (gesture.bodyWidth - TIME_COLUMN_WIDTH)
      setZoom({ scale: nextScale })
      requestAnimationFrame(() => {
        scroller.scrollLeft = anchoredScrollOffset(gesture.contentX, localX, TIME_COLUMN_WIDTH, stageRatio)
        scroller.scrollTop = anchoredScrollOffset(gesture.contentY, localY, STAGE_HEADER_HEIGHT, ratio)
      })
    }

    const end = (event: TouchEvent) => {
      if (event.touches.length < 2) gestureRef.current = undefined
    }

    body.addEventListener('touchstart', start, { passive: false })
    body.addEventListener('touchmove', move, { passive: false })
    body.addEventListener('touchend', end)
    body.addEventListener('touchcancel', end)
    return () => {
      body.removeEventListener('touchstart', start)
      body.removeEventListener('touchmove', move)
      body.removeEventListener('touchend', end)
      body.removeEventListener('touchcancel', end)
    }
  }, [bodyRef, scrollerRef])

  return zoom
}
