import { useRef, useState, type ChangeEvent } from 'react'
import type { FestivalMapCalibrationPoint } from './data/festivalMapCalibration'
import type { CalibrationQuality, FestivalMapTransform } from './festivalMapGeo'
import { useCalibrationGps, type StabilizedGpsReading } from './useCalibrationGps'

type MapCalibrationPanelProps = {
  points: FestivalMapCalibrationPoint[]
  transform?: FestivalMapTransform
  quality: CalibrationQuality
  storageMessage: string
  canUndo: boolean
  awaitingMapPoint: boolean
  simulationActive: boolean
  onCaptureAccepted: (reading: StabilizedGpsReading, label: string) => void
  onReplaceReading: (id: string, reading: StabilizedGpsReading) => void
  onCancelMapPoint: () => void
  onPatchPoint: (id: string, patch: Partial<FestivalMapCalibrationPoint>) => void
  onDeletePoint: (id: string) => void
  onUndo: () => void
  onReset: () => void
  onExport: () => string
  onImport: (json: string) => void
  onToggleSimulation: () => void
  onClose: () => void
}

const metres = (value?: number) => Number.isFinite(value)
  ? `${value!.toFixed(1)} m`
  : '—'

export function MapCalibrationPanel({
  points,
  transform,
  quality,
  storageMessage,
  canUndo,
  awaitingMapPoint,
  simulationActive,
  onCaptureAccepted,
  onReplaceReading,
  onCancelMapPoint,
  onPatchPoint,
  onDeletePoint,
  onUndo,
  onReset,
  onExport,
  onImport,
  onToggleSimulation,
  onClose,
}: MapCalibrationPanelProps) {
  const gps = useCalibrationGps()
  const [label, setLabel] = useState('')
  const [replaceId, setReplaceId] = useState<string>()
  const [importError, setImportError] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const beginCapture = (id?: string) => {
    setReplaceId(id)
    gps.start()
  }

  const acceptReading = () => {
    const reading = gps.accept()
    if (!reading) return
    if (replaceId) {
      onReplaceReading(replaceId, reading)
      setReplaceId(undefined)
    } else {
      onCaptureAccepted(reading, label.trim())
      setLabel('')
    }
  }

  const cancelCapture = () => {
    gps.cancel()
    setReplaceId(undefined)
  }

  const exportCalibration = () => {
    const blob = new Blob([onExport()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'lir26-map-calibration.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importCalibration = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      onImport(await file.text())
      setImportError('')
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Calibration import failed')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <aside className="calibration-panel" aria-label="Map calibration">
      <header>
        <strong>Calibrate map</strong>
        <button type="button" aria-label="Close calibration controls" onClick={onClose}>×</button>
      </header>

      <section className="calibration-quality" aria-live="polite">
        <b>{quality.status}</b>
        <span>{quality.progress}</span>
        <dl>
          <div><dt>Model</dt><dd>{quality.model}</dd></div>
          <div><dt>Average error</dt><dd>{metres(quality.averageErrorMeters)}</dd></div>
          <div><dt>Maximum error</dt><dd>{metres(quality.maximumErrorMeters)}</dd></div>
        </dl>
        {quality.clustered && <em>Points are clustered — spread them across the site.</em>}
        <small>
          1 point is insufficient. 2 points are provisional. At least 3 well-separated
          points are required; 4 or more are recommended.
        </small>
      </section>

      {!awaitingMapPoint && gps.status !== 'sampling' && (
        <div className="calibration-capture">
          <label>
            Optional landmark label
            <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Main entrance" />
          </label>
          <button type="button" className="calibration-primary" onClick={() => beginCapture()}>
            Use my current position
          </button>
        </div>
      )}

      {gps.status === 'sampling' && (
        <section className="gps-sampling" aria-live="polite">
          <b>{replaceId ? 'Replacing GPS reading' : 'Sampling GPS'}</b>
          {gps.reading ? (
            <dl>
              <div><dt>Latitude</dt><dd>{gps.reading.latitude.toFixed(7)}</dd></div>
              <div><dt>Longitude</dt><dd>{gps.reading.longitude.toFixed(7)}</dd></div>
              <div><dt>Accuracy</dt><dd className={gps.reading.accuracyMeters > 20 ? 'poor' : ''}>±{gps.reading.accuracyMeters.toFixed(1)} m</dd></div>
              <div><dt>Samples</dt><dd>{gps.reading.sampleCount} · {gps.reading.elapsedSeconds.toFixed(0)}s</dd></div>
              <div><dt>Stable</dt><dd>{gps.reading.stable ? 'Yes' : 'Not yet'}</dd></div>
            </dl>
          ) : <span>Waiting for the first reading…</span>}
          <p>{gps.message}</p>
          <div className="calibration-actions">
            <button type="button" onClick={cancelCapture}>Cancel</button>
            <button type="button" disabled={!gps.reading} onClick={acceptReading}>
              Accept current reading
            </button>
          </div>
        </section>
      )}

      {gps.status === 'error' && (
        <p className="calibration-error" role="alert">
          {gps.message} <button type="button" onClick={cancelCapture}>Dismiss</button>
        </p>
      )}

      {awaitingMapPoint && (
        <section className="calibration-map-prompt" aria-live="polite">
          <b>Now tap the matching point on the map</b>
          <span>Only this next deliberate map tap will save the point.</span>
          <button type="button" onClick={onCancelMapPoint}>Cancel</button>
        </section>
      )}

      <div className="calibration-tools">
        <button type="button" disabled={!canUndo} onClick={onUndo}>Undo last adjustment</button>
        <button type="button" aria-pressed={simulationActive} onClick={onToggleSimulation}>
          {simulationActive ? 'Stop GPS simulation' : 'Simulate GPS marker'}
        </button>
        <button type="button" onClick={exportCalibration}>Export calibration</button>
        <button type="button" onClick={() => importRef.current?.click()}>Import calibration</button>
        <input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importCalibration} />
        <button
          type="button"
          disabled={!points.length}
          onClick={() => {
            if (window.confirm('Delete all locally saved map calibration points?')) onReset()
          }}
        >
          Reset calibration
        </button>
      </div>
      {importError && <p className="calibration-error" role="alert">{importError}</p>}
      {storageMessage && <p className="calibration-error" role="alert">{storageMessage}</p>}

      <ol className="calibration-points">
        {points.map((point) => {
          const residual = transform?.residuals.find(({ id }) => id === point.id)
          return (
            <li key={point.id} className={residual?.likelyIncorrect ? 'calibration-point--suspect' : ''}>
              <label>
                Label
                <input
                  value={point.label ?? ''}
                  onChange={(event) => onPatchPoint(point.id, { label: event.target.value })}
                />
              </label>
              <span>GPS ±{point.accuracyMeters.toFixed(1)} m · residual {metres(residual?.errorMeters)}</span>
              {residual?.likelyIncorrect && <em>Likely incorrect point</em>}
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={!point.excluded}
                    onChange={(event) => onPatchPoint(point.id, { excluded: !event.target.checked })}
                  />
                  Included
                </label>
                <button type="button" onClick={() => beginCapture(point.id)}>Replace GPS</button>
                <button type="button" onClick={() => onDeletePoint(point.id)}>Delete</button>
              </div>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
