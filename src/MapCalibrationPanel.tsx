import { useRef, useState, type ChangeEvent } from 'react'
import type { FestivalMapCalibrationPoint } from './data/festivalMapCalibration'
import type { CalibrationQuality, FestivalMapTransform } from './festivalMapGeo'
import type { StabilizedGpsReading, useCalibrationGps } from './useCalibrationGps'

type MapCalibrationPanelProps = {
  points: FestivalMapCalibrationPoint[]
  transform?: FestivalMapTransform
  quality: CalibrationQuality
  storageMessage: string
  canUndo: boolean
  flow: 'idle' | 'capturing' | 'placing' | 'confirming'
  gps: ReturnType<typeof useCalibrationGps>
  label: string
  hasPlacementPreview: boolean
  simulationActive: boolean
  onLabelChange: (label: string) => void
  onAcceptCalibrationReading: (reading: StabilizedGpsReading) => void
  onSaveCalibrationPoint: () => void
  onChooseAnotherPoint: () => void
  onCancelFlow: () => void
  onReplaceReading: (id: string, reading: StabilizedGpsReading) => void
  onPatchPoint: (id: string, patch: Partial<FestivalMapCalibrationPoint>) => void
  onDeletePoint: (id: string) => void
  onUndo: () => void
  onReset: () => void
  onExport: () => string
  onImport: (json: string) => void
  onToggleSimulation: () => void
  onDisableSimulation: () => void
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
  flow,
  gps,
  label,
  hasPlacementPreview,
  simulationActive,
  onLabelChange,
  onAcceptCalibrationReading,
  onSaveCalibrationPoint,
  onChooseAnotherPoint,
  onCancelFlow,
  onReplaceReading,
  onPatchPoint,
  onDeletePoint,
  onUndo,
  onReset,
  onExport,
  onImport,
  onToggleSimulation,
  onDisableSimulation,
  onClose,
}: MapCalibrationPanelProps) {
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
      onAcceptCalibrationReading(reading)
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

      {flow !== 'idle' && (
        <div className="calibration-capture">
          <label>
            Optional landmark label
            <input value={label} onChange={(event) => onLabelChange(event.target.value)} placeholder="Main entrance" />
          </label>
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
            <button type="button" onClick={replaceId ? cancelCapture : onCancelFlow}>Cancel</button>
            <button type="button" disabled={!gps.reading} onClick={acceptReading}>
              {gps.reading?.stable ? 'Use stable reading' : 'Accept current reading'}
            </button>
          </div>
        </section>
      )}

      {gps.status === 'error' && (
        <p className="calibration-error" role="alert">
          {gps.message}{' '}
          <button type="button" onClick={replaceId ? cancelCapture : onCancelFlow}>Dismiss</button>
        </p>
      )}

      {flow === 'placing' && (
        <section className="calibration-map-prompt" aria-live="polite">
          <b>Now tap your exact position on the festival map</b>
          <span>A drag pans and a pinch zooms. Only a short deliberate tap selects the point.</span>
          <button type="button" onClick={onCancelFlow}>Cancel</button>
        </section>
      )}

      {flow === 'confirming' && hasPlacementPreview && (
        <section className="calibration-map-prompt calibration-confirm" aria-live="polite">
          <b>Confirm calibration point</b>
          <span>The crosshair is only a preview. Nothing is saved until you confirm.</span>
          <div className="calibration-actions">
            <button type="button" onClick={onCancelFlow}>Cancel</button>
            <button type="button" onClick={onChooseAnotherPoint}>Choose another point</button>
            <button type="button" className="calibration-primary" onClick={onSaveCalibrationPoint}>
              Save calibration point
            </button>
          </div>
        </section>
      )}

      <div className="calibration-tools">
        <button type="button" disabled={!canUndo} onClick={onUndo}>Undo last adjustment</button>
        <button type="button" aria-pressed={simulationActive} onClick={onToggleSimulation}>
          {simulationActive ? 'Change simulated GPS' : 'Simulate GPS'}
        </button>
        {simulationActive && (
          <button type="button" onClick={onDisableSimulation}>Disable GPS simulation</button>
        )}
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
              <span>
                GPS {point.accuracyMeters === undefined ? 'accuracy unknown' : `±${point.accuracyMeters.toFixed(1)} m`}
                {' · '}{new Date(point.createdAt).toLocaleString()}
                {' · '}residual {metres(residual?.errorMeters)}
              </span>
              {residual?.likelyIncorrect && <em>Likely incorrect point</em>}
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={point.enabled !== false && !point.excluded}
                    onChange={(event) => onPatchPoint(point.id, {
                      enabled: event.target.checked,
                      excluded: false,
                    })}
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
