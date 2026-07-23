import { useEffect, useRef, type MouseEvent } from 'react'
import type { MapStageLocation } from './data/mapStageLocations'

type FestivalMapProps = {
  location?: MapStageLocation
  onClose: () => void
}

export function FestivalMap({ location, onClose }: FestivalMapProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const centreStage = () => {
    const viewport = viewportRef.current
    const canvas = canvasRef.current
    if (!viewport || !canvas || !location) return
    viewport.scrollLeft = canvas.scrollWidth * location.xPercent / 100 - viewport.clientWidth / 2
    viewport.scrollTop = canvas.scrollHeight * location.yPercent / 100 - viewport.clientHeight / 2
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (location && !dialog.open) {
      dialog.showModal()
      requestAnimationFrame(centreStage)
    } else if (!location && dialog.open) {
      dialog.close()
    }
  }, [location])

  const close = () => dialogRef.current?.close()
  const closeFromBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) close()
  }

  return (
    <dialog
      className="map-dialog"
      ref={dialogRef}
      aria-labelledby="map-title"
      onClick={closeFromBackdrop}
      onClose={onClose}
    >
      <section className="map-panel">
        <header className="map-toolbar">
          <div>
            <strong id="map-title">Festival map</strong>
            {location && <span>{location.mapLabel}</span>}
          </div>
          <button type="button" aria-label="Close festival map" onClick={close}>×</button>
        </header>
        <div className="map-viewport" ref={viewportRef}>
          <div className="map-canvas" ref={canvasRef}>
            <img
              src={`${import.meta.env.BASE_URL}maps/lir26-map.jpg`}
              alt="Official Let It Roll 2026 festival map"
              onLoad={centreStage}
            />
            {location && (
              <span
                className="map-stage-highlight"
                style={{
                  left: `${location.xPercent}%`,
                  top: `${location.yPercent}%`,
                  width: `${location.highlightWidthPercent ?? 5}%`,
                  height: `${location.highlightHeightPercent ?? 8}%`,
                }}
                role="status"
                aria-label={`${location.mapLabel} highlighted on festival map`}
              >
                <span>{location.mapLabel}</span>
              </span>
            )}
          </div>
        </div>
      </section>
    </dialog>
  )
}
