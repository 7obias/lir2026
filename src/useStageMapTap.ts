import { useRef, type PointerEvent as ReactPointerEvent } from 'react'

const MOVE_TOLERANCE_PX = 10

type ActivePointer = {
  stageId: string
  x: number
  y: number
  valid: boolean
}

export function useStageMapTap(onOpen: (stageId: string) => void) {
  const pointersRef = useRef(new Map<number, ActivePointer>())

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, stageId: string) => {
    pointersRef.current.set(event.pointerId, {
      stageId,
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
    if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) >= MOVE_TOLERANCE_PX) {
      pointer.valid = false
    }
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const pointer = pointersRef.current.get(event.pointerId)
    pointersRef.current.delete(event.pointerId)
    if (!pointer?.valid || pointersRef.current.size > 0) return

    const releasedHeading = document.elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-map-stage-id]')
    if (releasedHeading?.dataset.mapStageId !== pointer.stageId) return

    event.preventDefault()
    event.stopPropagation()
    onOpen(pointer.stageId)
  }

  const onPointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    pointersRef.current.delete(event.pointerId)
  }

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
}
