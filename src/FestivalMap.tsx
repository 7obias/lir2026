import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import type { MapStageLocation } from './data/mapStageLocations'
import { useLiveMapPosition } from './useLiveMapPosition'
import { useMapCalibration } from './useMapCalibration'
import { MapCalibrationPanel } from './MapCalibrationPanel'
import { useCalibrationGps } from './useCalibrationGps'
import type { MapPoint } from './festivalMapGeo'
import { CoordinateInputDialog, type EnteredCoordinates } from './CoordinateInputDialog'

type FestivalMapProps = {
  location?: MapStageLocation
  onClose: () => void
}

type CalibrationFlow = 'idle' | 'capturing' | 'placing' | 'confirming'
type PendingCalibrationCoordinates = EnteredCoordinates

export function FestivalMap({ location, onClose }: FestivalMapProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const calibration = useMapCalibration()
  const tracking = useLiveMapPosition(Boolean(location), calibration.transform)
  const calibrationGps = useCalibrationGps()
  const [calibrationOpen, setCalibrationOpen] = useState(false)
  const [calibrationFlow, setCalibrationFlow] = useState<CalibrationFlow>('idle')
  const [pendingReading, setPendingReading] = useState<PendingCalibrationCoordinates>()
  const [placementPreview, setPlacementPreview] = useState<MapPoint>()
  const [calibrationDialogOpen, setCalibrationDialogOpen] = useState(false)
  const [simulationDialogOpen, setSimulationDialogOpen] = useState(false)
  const [simulationActive, setSimulationActive] = useState(false)
  const [simulatedCoordinates, setSimulatedCoordinates] = useState<EnteredCoordinates>()
  const mapTapRef = useRef<{
    x: number
    y: number
    pointerId: number
    moved: boolean
  } | undefined>(undefined)
  const dragRef = useRef<{ id: string } | undefined>(undefined)

  const centreStage = () => {
    const viewport = viewportRef.current
    const canvas = canvasRef.current
    if (!viewport || !canvas || !location) return
    viewport.scrollLeft = canvas.scrollWidth * location.xPercent / 100 - viewport.clientWidth / 2
    viewport.scrollTop = canvas.scrollHeight * location.yPercent / 100 - viewport.clientHeight / 2
  }

  const centreMapPoint = (point: MapPoint) => {
    const viewport = viewportRef.current
    const canvas = canvasRef.current
    if (!viewport || !canvas) return
    viewport.scrollLeft = canvas.scrollWidth * point.xPercent / 100 - viewport.clientWidth / 2
    viewport.scrollTop = canvas.scrollHeight * point.yPercent / 100 - viewport.clientHeight / 2
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

  const mapPercent = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const bounds = canvas.getBoundingClientRect()
    return {
      xPercent: Math.max(0, Math.min(100, (clientX - bounds.left) / bounds.width * 100)),
      yPercent: Math.max(0, Math.min(100, (clientY - bounds.top) / bounds.height * 100)),
    }
  }

  const onMapPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (calibrationFlow !== 'placing' || event.button !== 0) return
    if (!(event.target instanceof HTMLImageElement)) return
    if (mapTapRef.current) {
      mapTapRef.current.moved = true
      return
    }
    mapTapRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      moved: false,
    }
  }

  const onMapPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = mapTapRef.current
    if (
      start
      && (event.pointerId !== start.pointerId
        || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8)
    ) start.moved = true
  }

  const onMapPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = mapTapRef.current
    mapTapRef.current = undefined
    if (!start || start.pointerId !== event.pointerId || start.moved) return
    const point = mapPercent(event.clientX, event.clientY)
    if (!point) return
    if (pendingReading) {
      setPlacementPreview(point)
      setCalibrationFlow('confirming')
    }
  }

  const cancelCalibrationFlow = () => {
    calibrationGps.cancel()
    setCalibrationDialogOpen(false)
    setCalibrationFlow('idle')
    setPendingReading(undefined)
    setPlacementPreview(undefined)
  }

  const beginCalibrationFlow = () => {
    tracking.stop()
    setSimulationActive(false)
    setSimulatedCoordinates(undefined)
    setPendingReading(undefined)
    setPlacementPreview(undefined)
    setCalibrationFlow('idle')
    setCalibrationDialogOpen(true)
  }

  const acceptCalibrationCoordinates = (coordinates: EnteredCoordinates) => {
    setPendingReading(coordinates)
    setCalibrationDialogOpen(false)
    setCalibrationFlow('placing')
  }

  const saveCalibrationPoint = () => {
    if (!pendingReading || !placementPreview) return
    calibration.addPoint({
      id: crypto.randomUUID(),
      latitude: pendingReading.latitude,
      longitude: pendingReading.longitude,
      accuracyMeters: pendingReading.accuracyMeters,
      ...placementPreview,
      source: pendingReading.source,
      enabled: true,
      createdAt: new Date().toISOString(),
    })
    setCalibrationFlow('idle')
    setPendingReading(undefined)
    setPlacementPreview(undefined)
  }

  const startMarkerDrag = (event: PointerEvent<HTMLButtonElement>, id: string) => {
    event.preventDefault()
    event.stopPropagation()
    calibration.checkpoint()
    dragRef.current = { id }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveMarker = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return
    const point = mapPercent(event.clientX, event.clientY)
    if (point) calibration.patchPoint(dragRef.current.id, point, false)
  }

  const finishMarkerDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return
    event.preventDefault()
    event.stopPropagation()
    dragRef.current = undefined
  }

  const simulatedPosition = simulationActive && simulatedCoordinates && calibration.transform
    ? calibration.transform.project(simulatedCoordinates.latitude, simulatedCoordinates.longitude)
    : undefined
  const displayedPosition = simulatedPosition
    ? {
        ...simulatedPosition,
        accuracyWidthPercent: 1.4,
        accuracyHeightPercent: 1.4,
        heading: 0,
      }
    : tracking.position
  const calibrationStatus = calibration.quality.activeCount === 0
    ? 'Not calibrated'
    : calibration.quality.activeCount === 1
      ? '1 calibration point'
      : calibration.quality.activeCount === 2
        ? '2 points — provisional'
        : calibration.quality.activeCount === 3
          ? '3 points — usable'
          : `${calibration.quality.activeCount} points — ${calibration.quality.status === 'Good calibration' ? 'good' : 'usable'}`

  return (
    <dialog
      className="map-dialog"
      ref={dialogRef}
      aria-labelledby="map-title"
      onClick={closeFromBackdrop}
      onClose={(event) => {
        if (event.target !== event.currentTarget) return
        cancelCalibrationFlow()
        setSimulationDialogOpen(false)
        setCalibrationOpen(false)
        onClose()
      }}
    >
      <section className={`map-panel${calibrationFlow !== 'idle' ? ' map-panel--calibrating' : ''}`}>
        <header className="map-toolbar">
          <div>
            <strong id="map-title">Festival map</strong>
            {location && <span>{location.mapLabel}</span>}
          </div>
          <div className="map-toolbar-actions">
            <span className="map-calibration-status">{calibrationStatus}</span>
            <button
              type="button"
              className="map-manage-calibration"
              disabled={calibrationFlow !== 'idle'}
              onClick={() => setCalibrationOpen(true)}
            >
              Manage
            </button>
            <button
              type="button"
              className={`map-calibrate-button map-calibrate-button--icon${calibrationFlow !== 'idle' ? ' map-calibrate-button--active' : ''}`}
              aria-label="Add map calibration point"
              title="Add map calibration point"
              disabled={calibrationFlow !== 'idle'}
              onClick={beginCalibrationFlow}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
              </svg>
              {calibration.quality.activeCount > 0 && <b>{calibration.quality.activeCount}</b>}
            </button>
            <button
              type="button"
              className={`map-location-button map-location-button--${simulationActive ? 'active' : tracking.status}`}
              aria-label={simulationActive
                ? 'Show simulated location'
                : tracking.status === 'active' ? 'Hide my position' : 'Show my position'}
              aria-pressed={simulationActive || tracking.status === 'active'}
              title={simulationActive ? 'Show simulated location' : 'Show my position'}
              disabled={calibrationFlow !== 'idle'}
              onClick={() => {
                if (simulationActive && simulatedPosition) centreMapPoint(simulatedPosition)
                else if (tracking.status === 'active' || tracking.status === 'acquiring') tracking.stop()
                else {
                  tracking.start()
                }
              }}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M20.4 3.6 14 20.2l-2.8-7.4-7.4-2.8 16.6-6.4Z" />
              </svg>
              {tracking.status === 'acquiring' && <span className="map-location-spinner" />}
              {tracking.status === 'error' && <span className="map-location-warning">!</span>}
            </button>
            {calibrationFlow !== 'idle' && (
              <button type="button" className="map-calibration-cancel" onClick={cancelCalibrationFlow}>
                Cancel
              </button>
            )}
            <button type="button" aria-label="Close festival map" onClick={close}>×</button>
          </div>
        </header>
        <CoordinateInputDialog
          open={calibrationDialogOpen}
          title="Add map calibration point"
          onConfirm={acceptCalibrationCoordinates}
          onCancel={() => setCalibrationDialogOpen(false)}
        />
        <CoordinateInputDialog
          open={simulationDialogOpen}
          title="Simulate GPS"
          initialCoordinates={simulatedCoordinates}
          blockingMessage={calibration.transform
            ? undefined
            : 'Map not sufficiently calibrated. Add at least two enabled calibration points first.'}
          onConfirm={(coordinates) => {
            setSimulatedCoordinates(coordinates)
            setSimulationActive(true)
            setSimulationDialogOpen(false)
            tracking.stop()
            requestAnimationFrame(() => {
              const point = calibration.transform?.project(coordinates.latitude, coordinates.longitude)
              if (point) centreMapPoint(point)
            })
          }}
          onCancel={() => setSimulationDialogOpen(false)}
        />
        {!calibration.transform && calibrationFlow === 'idle' && (
          <p className="map-calibration-unavailable" role="status">
            Map not sufficiently calibrated · real position display unavailable
          </p>
        )}
        {calibration.quality.model === 'similarity' && calibrationFlow === 'idle' && (
          <p className="map-calibration-unavailable" role="status">
            Provisional two-point calibration · position is approximate
          </p>
        )}
        {simulationActive && simulatedCoordinates && (
          <p className="map-simulation-badge">
            SIMULATED GPS · {simulatedCoordinates.latitude.toFixed(6)}, {simulatedCoordinates.longitude.toFixed(6)}
          </p>
        )}
        {calibrationFlow === 'placing' && (
          <p className="map-placement-banner" role="status">Tap the matching position on the festival map.</p>
        )}
        {calibrationFlow === 'confirming' && (
          <p className="map-placement-banner" role="status">Confirm the selected calibration point</p>
        )}
        {tracking.message && <p className="map-location-message" role="status">{tracking.message}</p>}
        <div className="map-viewport" ref={viewportRef}>
          <div
            className={`map-canvas${calibrationFlow === 'placing' ? ' map-canvas--placing' : ''}`}
            ref={canvasRef}
            onPointerDown={onMapPointerDown}
            onPointerMove={onMapPointerMove}
            onPointerUp={onMapPointerUp}
            onPointerCancel={() => { mapTapRef.current = undefined }}
          >
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
              </span>
            )}
            {calibrationOpen && (
              <>
                <svg className="map-calibration-verification" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  {calibration.transform?.residuals.map((residual) => {
                    const point = calibration.points.find(({ id }) => id === residual.id)
                    if (!point) return null
                    return (
                      <line
                        key={residual.id}
                        x1={point.xPercent}
                        y1={point.yPercent}
                        x2={residual.predicted.xPercent}
                        y2={residual.predicted.yPercent}
                      />
                    )
                  })}
                </svg>
                {calibration.points.map((point, index) => {
                  const predicted = calibration.transform?.residuals.find(({ id }) => id === point.id)?.predicted
                  return (
                    <span key={point.id}>
                      {predicted && (
                        <span
                          className="map-calibration-predicted"
                          style={{ left: `${predicted.xPercent}%`, top: `${predicted.yPercent}%` }}
                          title="Position predicted by the calibration model"
                        />
                      )}
                      <button
                        type="button"
                        className={`map-calibration-marker${point.enabled === false || point.excluded ? ' map-calibration-marker--excluded' : ''}`}
                        style={{ left: `${point.xPercent}%`, top: `${point.yPercent}%` }}
                        aria-label={`Calibration point ${index + 1}${point.label ? `: ${point.label}` : ''}. Drag to adjust map position.`}
                        onPointerDown={(event) => startMarkerDrag(event, point.id)}
                        onPointerMove={moveMarker}
                        onPointerUp={finishMarkerDrag}
                        onPointerCancel={finishMarkerDrag}
                      >
                        {index + 1}
                      </button>
                    </span>
                  )
                })}
              </>
            )}
            {placementPreview && (
              <span
                className="map-calibration-preview"
                style={{ left: `${placementPreview.xPercent}%`, top: `${placementPreview.yPercent}%` }}
                role="status"
                aria-label="Selected calibration point preview"
              />
            )}
            {displayedPosition && (
              <div
                className="map-user-location"
                style={{
                  '--user-x': `${displayedPosition.xPercent}%`,
                  '--user-y': `${displayedPosition.yPercent}%`,
                } as CSSProperties}
                role="status"
                aria-label={simulatedPosition
                  ? 'Simulated GPS position'
                  : `Your approximate position${displayedPosition.heading === undefined ? ', direction unavailable' : ''}`}
              >
                <span
                  className="map-user-accuracy"
                  style={{
                    width: `${displayedPosition.accuracyWidthPercent}%`,
                    height: `${displayedPosition.accuracyHeightPercent}%`,
                  }}
                />
                {displayedPosition.heading !== undefined && (
                  <span
                    className="map-user-direction"
                    style={{ transform: `translate(-50%, -100%) rotate(${displayedPosition.heading}deg)` }}
                  />
                )}
                <span className="map-user-dot" />
              </div>
            )}
          </div>
        </div>
        {calibrationFlow === 'confirming' && pendingReading && placementPreview && (
          <section className="map-calibration-confirmation" aria-label="Confirm map calibration point">
            <strong>Pending calibration</strong>
            <dl>
              <div><dt>Latitude</dt><dd>{pendingReading.latitude.toFixed(6)}</dd></div>
              <div><dt>Longitude</dt><dd>{pendingReading.longitude.toFixed(6)}</dd></div>
              {pendingReading.accuracyMeters !== undefined && (
                <div><dt>Accuracy</dt><dd>±{pendingReading.accuracyMeters.toFixed(1)} m</dd></div>
              )}
            </dl>
            <span>Tap Save to create this calibration point.</span>
            <div>
              <button type="button" onClick={cancelCalibrationFlow}>Cancel</button>
              <button
                type="button"
                onClick={() => {
                  setPlacementPreview(undefined)
                  setCalibrationFlow('placing')
                }}
              >
                Choose another point
              </button>
              <button type="button" className="map-coordinate-ok" onClick={saveCalibrationPoint}>Save</button>
            </div>
          </section>
        )}
        {calibrationOpen && (
          <MapCalibrationPanel
            points={calibration.points}
            transform={calibration.transform}
            quality={calibration.quality}
            storageMessage={calibration.storageMessage}
            canUndo={calibration.canUndo}
            flow="idle"
            gps={calibrationGps}
            label=""
            hasPlacementPreview={false}
            simulationActive={simulationActive}
            onLabelChange={() => {}}
            onAcceptCalibrationReading={() => {}}
            onSaveCalibrationPoint={saveCalibrationPoint}
            onChooseAnotherPoint={() => {
              setPlacementPreview(undefined)
              setCalibrationFlow('placing')
            }}
            onCancelFlow={cancelCalibrationFlow}
            onReplaceReading={(id, reading) => calibration.patchPoint(id, {
              latitude: reading.latitude,
              longitude: reading.longitude,
              accuracyMeters: reading.accuracyMeters,
              source: 'current-location',
              enabled: true,
              createdAt: new Date().toISOString(),
            })}
            onPatchPoint={calibration.patchPoint}
            onDeletePoint={calibration.deletePoint}
            onUndo={calibration.undo}
            onReset={() => {
              calibration.reset()
              cancelCalibrationFlow()
            }}
            onRestoreDefaults={calibration.restoreDefaults}
            onExport={calibration.exportJson}
            onImport={calibration.importJson}
            onToggleSimulation={() => {
              setSimulationDialogOpen(true)
            }}
            onDisableSimulation={() => {
              setSimulationActive(false)
              setSimulatedCoordinates(undefined)
              tracking.start()
            }}
            onClose={() => {
              if (calibrationFlow !== 'idle') cancelCalibrationFlow()
              setCalibrationOpen(false)
            }}
          />
        )}
      </section>
    </dialog>
  )
}
