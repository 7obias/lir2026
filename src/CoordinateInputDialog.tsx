import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
} from 'react'
import { parseCoordinatePair, validLatitude, validLongitude } from './calibrationCoordinates'

export type EnteredCoordinates = {
  latitude: number
  longitude: number
  source: 'current-location' | 'manual'
  accuracyMeters?: number
}

type CoordinateInputDialogProps = {
  open: boolean
  title: string
  confirmLabel?: string
  blockingMessage?: string
  initialCoordinates?: Pick<EnteredCoordinates, 'latitude' | 'longitude'>
  onConfirm: (coordinates: EnteredCoordinates) => void
  onCancel: () => void
}

export function CoordinateInputDialog({
  open,
  title,
  confirmLabel = 'OK',
  blockingMessage,
  initialCoordinates,
  onConfirm,
  onCancel,
}: CoordinateInputDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const requestRef = useRef(0)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const [latitudeInput, setLatitudeInput] = useState('')
  const [longitudeInput, setLongitudeInput] = useState('')
  const [source, setSource] = useState<EnteredCoordinates['source']>('manual')
  const [accuracy, setAccuracy] = useState<number>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      setUseCurrentLocation(false)
      setLatitudeInput(initialCoordinates ? String(initialCoordinates.latitude) : '')
      setLongitudeInput(initialCoordinates ? String(initialCoordinates.longitude) : '')
      setSource('manual')
      setAccuracy(undefined)
      setLoading(false)
      setError('')
      dialog.showModal()
    } else if (!open && dialog.open) {
      requestRef.current += 1
      dialog.close()
    }
  }, [initialCoordinates, open])

  const captureCurrentLocation = () => {
    const requestId = requestRef.current + 1
    requestRef.current = requestId
    setLoading(true)
    setError('')
    if (!navigator.geolocation) {
      setUseCurrentLocation(false)
      setLoading(false)
      setError('Current location is unavailable. Enter coordinates manually.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (requestRef.current !== requestId) return
        setLatitudeInput(String(coords.latitude))
        setLongitudeInput(String(coords.longitude))
        setSource('current-location')
        setAccuracy(coords.accuracy)
        setLoading(false)
      },
      (geolocationError) => {
        if (requestRef.current !== requestId) return
        setUseCurrentLocation(false)
        setSource('manual')
        setLoading(false)
        setError(geolocationError.code === geolocationError.PERMISSION_DENIED
          ? 'Location permission was denied. Enter coordinates manually.'
          : 'Current location is unavailable. Enter coordinates manually.')
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
    )
  }

  const latitude = Number(latitudeInput.trim())
  const longitude = Number(longitudeInput.trim())
  const latitudeIsValid = validLatitude(latitudeInput)
  const longitudeIsValid = validLongitude(longitudeInput)
  const valid = latitudeIsValid && longitudeIsValid && !blockingMessage

  const pasteCoordinates = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text')
    const pair = parseCoordinatePair(pasted)
    if (!pair) {
      if (pasted.includes(',') || pasted.includes('(') || pasted.includes(')')) {
        event.preventDefault()
        setError(
          'Invalid coordinate pair. Paste latitude first, then longitude, for example (50.522276, 13.646852).',
        )
      }
      return
    }
    event.preventDefault()
    requestRef.current += 1
    setLatitudeInput(pair.latitude)
    setLongitudeInput(pair.longitude)
    setUseCurrentLocation(false)
    setSource('manual')
    setAccuracy(undefined)
    setLoading(false)
    setError('')
  }

  return (
    <dialog
      className="map-coordinate-dialog"
      ref={dialogRef}
      aria-label={title}
      onClose={(event) => {
        event.stopPropagation()
        requestRef.current += 1
        setLoading(false)
        if (open) onCancel()
      }}
    >
      <form method="dialog" onSubmit={(event) => event.preventDefault()}>
        <h2>{title}</h2>
        <label className="map-coordinate-switch">
          <input
            type="checkbox"
            role="switch"
            checked={useCurrentLocation}
            onChange={(event) => {
              const enabled = event.target.checked
              setUseCurrentLocation(enabled)
              setError('')
              if (enabled) captureCurrentLocation()
              else {
                requestRef.current += 1
                setLoading(false)
                setSource('manual')
                setAccuracy(undefined)
              }
            }}
          />
          Use current location
        </label>
        {loading && <p className="map-coordinate-status" role="status">Acquiring current location…</p>}
        {error && <p className="map-coordinate-error" role="alert">{error}</p>}
        {blockingMessage && <p className="map-coordinate-error" role="alert">{blockingMessage}</p>}
        {accuracy !== undefined && (
          <p className="map-coordinate-status">Reported accuracy: ±{accuracy.toFixed(1)} m</p>
        )}
        <label>
          Latitude
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={latitudeInput}
            aria-invalid={latitudeInput !== '' && !latitudeIsValid}
            placeholder="50.522276"
            onPaste={pasteCoordinates}
            onChange={(event) => {
              setLatitudeInput(event.target.value)
              setError('')
            }}
          />
        </label>
        {latitudeInput !== '' && !latitudeIsValid && (
          <small className="map-coordinate-error">Enter a finite latitude between −90 and 90.</small>
        )}
        <label>
          Longitude
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={longitudeInput}
            aria-invalid={longitudeInput !== '' && !longitudeIsValid}
            placeholder="13.646852"
            onPaste={pasteCoordinates}
            onChange={(event) => {
              setLongitudeInput(event.target.value)
              setError('')
            }}
          />
        </label>
        {longitudeInput !== '' && !longitudeIsValid && (
          <small className="map-coordinate-error">Enter a finite longitude between −180 and 180.</small>
        )}
        <small className="map-coordinate-hint">
          Paste “50.522276, 13.646852” or “(50.522276, 13.646852)” into either field.
        </small>
        <div className="map-coordinate-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className="map-coordinate-ok"
            disabled={!valid || loading}
            onClick={() => onConfirm({
              latitude,
              longitude,
              source,
              accuracyMeters: source === 'current-location' ? accuracy : undefined,
            })}
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  )
}
