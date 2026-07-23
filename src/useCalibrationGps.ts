import { useCallback, useEffect, useRef, useState } from 'react'

export type StabilizedGpsReading = {
  latitude: number
  longitude: number
  accuracyMeters: number
  sampleCount: number
  elapsedSeconds: number
  stable: boolean
}

const stabilize = (samples: GeolocationCoordinates[], elapsedSeconds: number): StabilizedGpsReading | undefined => {
  if (!samples.length) return undefined
  const preferred = [...samples].sort((first, second) => first.accuracy - second.accuracy)
    .slice(0, Math.min(6, samples.length))
  const weights = preferred.map((sample) => 1 / Math.max(4, sample.accuracy) ** 2)
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  const latitude = preferred.reduce((sum, sample, index) => sum + sample.latitude * weights[index], 0) / totalWeight
  const longitude = preferred.reduce((sum, sample, index) => sum + sample.longitude * weights[index], 0) / totalWeight
  const metresPerLatitudeDegree = 111_320
  const metresPerLongitudeDegree = metresPerLatitudeDegree * Math.cos(latitude * Math.PI / 180)
  const maximumSpread = Math.max(...preferred.map((sample) => Math.hypot(
    (sample.latitude - latitude) * metresPerLatitudeDegree,
    (sample.longitude - longitude) * metresPerLongitudeDegree,
  )))
  return {
    latitude,
    longitude,
    accuracyMeters: preferred[0].accuracy,
    sampleCount: samples.length,
    elapsedSeconds,
    stable: elapsedSeconds >= 5
      && samples.length >= 4
      && preferred[0].accuracy <= 20
      && maximumSpread <= Math.max(12, preferred[0].accuracy),
  }
}

export function useCalibrationGps() {
  const [reading, setReading] = useState<StabilizedGpsReading>()
  const [status, setStatus] = useState<'idle' | 'sampling' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const watchRef = useRef<number | undefined>(undefined)
  const startTimeRef = useRef(0)
  const samplesRef = useRef<GeolocationCoordinates[]>([])

  const cancel = useCallback(() => {
    if (watchRef.current !== undefined) navigator.geolocation.clearWatch(watchRef.current)
    watchRef.current = undefined
    samplesRef.current = []
    setReading(undefined)
    setStatus('idle')
    setMessage('')
  }, [])

  const start = useCallback(() => {
    cancel()
    if (!navigator.geolocation) {
      setStatus('error')
      setMessage('Location unavailable')
      return
    }
    setStatus('sampling')
    setMessage('Collecting GPS samples…')
    startTimeRef.current = Date.now()
    watchRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        samplesRef.current = [...samplesRef.current, coords].slice(-20)
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        const next = stabilize(samplesRef.current, elapsed)
        setReading(next)
        if (next) {
          setMessage(next.stable
            ? 'Reading stable'
            : next.accuracyMeters > 20 ? 'Poor accuracy — wait for a better reading or accept it' : 'Stabilizing…')
        }
      },
      (error) => {
        setStatus('error')
        setMessage(error.code === error.PERMISSION_DENIED ? 'Location permission denied' : 'Unable to acquire GPS')
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
    )
  }, [cancel])

  const accept = useCallback(() => {
    if (!reading) return undefined
    if (watchRef.current !== undefined) navigator.geolocation.clearWatch(watchRef.current)
    watchRef.current = undefined
    setStatus('idle')
    return reading
  }, [reading])

  useEffect(() => cancel, [cancel])

  return { status, reading, message, start, accept, cancel }
}
