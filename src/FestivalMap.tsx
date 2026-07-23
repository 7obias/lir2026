import { useEffect, useRef, type CSSProperties, type MouseEvent } from 'react'
import type { MapStageLocation } from './data/mapStageLocations'
import { useLiveMapPosition } from './useLiveMapPosition'

type FestivalMapProps = {
  location?: MapStageLocation
  onClose: () => void
}

export function FestivalMap({ location, onClose }: FestivalMapProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const tracking = useLiveMapPosition(Boolean(location))

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
          <div className="map-toolbar-actions">
            <button
              type="button"
              className={`map-location-button map-location-button--${tracking.status}`}
              aria-label={tracking.status === 'active' ? 'Hide my position' : 'Show my position'}
              aria-pressed={tracking.status === 'active'}
              title={tracking.status === 'active' ? 'Hide my position' : 'Show my position'}
              onClick={tracking.status === 'active' || tracking.status === 'acquiring' ? tracking.stop : tracking.start}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M20.4 3.6 14 20.2l-2.8-7.4-7.4-2.8 16.6-6.4Z" />
              </svg>
              {tracking.status === 'acquiring' && <span className="map-location-spinner" />}
              {tracking.status === 'error' && <span className="map-location-warning">!</span>}
            </button>
            <button type="button" aria-label="Close festival map" onClick={close}>×</button>
          </div>
        </header>
        {tracking.message && <p className="map-location-message" role="status">{tracking.message}</p>}
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
            {tracking.position && (
              <div
                className="map-user-location"
                style={{
                  '--user-x': `${tracking.position.xPercent}%`,
                  '--user-y': `${tracking.position.yPercent}%`,
                } as CSSProperties}
                role="status"
                aria-label={`Your approximate position${tracking.position.heading === undefined ? ', direction unavailable' : ''}`}
              >
                <span
                  className="map-user-accuracy"
                  style={{
                    width: `${tracking.position.accuracyWidthPercent}%`,
                    height: `${tracking.position.accuracyHeightPercent}%`,
                  }}
                />
                {tracking.position.heading !== undefined && (
                  <span
                    className="map-user-direction"
                    style={{ transform: `translate(-50%, -100%) rotate(${tracking.position.heading}deg)` }}
                  />
                )}
                <span className="map-user-dot" />
              </div>
            )}
          </div>
        </div>
      </section>
    </dialog>
  )
}
