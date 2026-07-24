import { useCallback, useEffect, useRef, useState } from 'react'
import {
  accuracyEllipse,
  normalizeHeading,
  smoothCoordinates,
  smoothHeading,
  type FestivalMapTransform,
  type MapPoint,
} from './festivalMapGeo'

type TrackingStatus = 'inactive' | 'acquiring' | 'active' | 'error'

type DeviceOrientationWithCompass = DeviceOrientationEvent & {
  webkitCompassHeading?: number
  webkitCompassAccuracy?: number
}

type OrientationPermissionEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export type LiveMapPosition = MapPoint & {
  accuracyWidthPercent: number
  accuracyHeightPercent: number
  heading?: number
}

const screenAngle = () => {
  const legacyWindow = window as Window & { orientation?: number }
  return window.screen.orientation?.angle ?? legacyWindow.orientation ?? 0
}

export function useLiveMapPosition(active: boolean, transform?: FestivalMapTransform) {
  const [status, setStatus] = useState<TrackingStatus>('inactive')
  const [position, setPosition] = useState<LiveMapPosition>()
  const [message, setMessage] = useState('')
  const watchIdRef = useRef<number | undefined>(undefined)
  const coordinatesRef = useRef<{ latitude: number; longitude: number } | undefined>(undefined)
  const headingRef = useRef<number | undefined>(undefined)
  const orientationEnabledRef = useRef(false)

  const onOrientation = useCallback((rawEvent: DeviceOrientationEvent) => {
    const event = rawEvent as DeviceOrientationWithCompass
    let heading: number | undefined
    if (
      typeof event.webkitCompassHeading === 'number'
      && Number.isFinite(event.webkitCompassHeading)
      && (event.webkitCompassAccuracy === undefined || event.webkitCompassAccuracy >= 0)
    ) {
      heading = event.webkitCompassHeading + screenAngle()
    } else if (event.absolute && typeof event.alpha === 'number') {
      heading = 360 - event.alpha + screenAngle()
    }
    if (heading === undefined) return
    headingRef.current = smoothHeading(headingRef.current, normalizeHeading(heading))
    setPosition((current) => current ? { ...current, heading: headingRef.current } : current)
    setMessage('')
  }, [])

  const stop = useCallback(() => {
    if (watchIdRef.current !== undefined) navigator.geolocation.clearWatch(watchIdRef.current)
    watchIdRef.current = undefined
    if (orientationEnabledRef.current) window.removeEventListener('deviceorientation', onOrientation, true)
    orientationEnabledRef.current = false
    coordinatesRef.current = undefined
    headingRef.current = undefined
    setPosition(undefined)
    setMessage('')
    setStatus('inactive')
  }, [onOrientation])

  const start = useCallback(() => {
    if (!active || status === 'acquiring' || status === 'active') return
    if (!transform) {
      setStatus('error')
      setMessage('Map not sufficiently calibrated')
      return
    }
    setStatus('acquiring')
    setMessage('Finding your position…')

    const orientationEvent = DeviceOrientationEvent as OrientationPermissionEvent
    const orientationPermission = orientationEvent.requestPermission
      ? orientationEvent.requestPermission()
      : Promise.resolve<'granted'>('granted')

    orientationPermission.then((permission) => {
      if (permission === 'granted') {
        orientationEnabledRef.current = true
        window.addEventListener('deviceorientation', onOrientation, true)
      } else {
        setMessage('')
      }
    }).catch(() => setMessage(''))

    if (!navigator.geolocation) {
      setStatus('error')
      setMessage('Location unavailable')
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const smoothed = smoothCoordinates(coordinatesRef.current, coords)
        coordinatesRef.current = smoothed
        const point = transform.project(smoothed.latitude, smoothed.longitude)
        const accuracy = accuracyEllipse(transform.project, smoothed.latitude, smoothed.longitude, coords.accuracy)
        setPosition({
          ...point,
          accuracyWidthPercent: accuracy.widthPercent,
          accuracyHeightPercent: accuracy.heightPercent,
          heading: headingRef.current,
        })
        setStatus('active')
        setMessage('')
      },
      (error) => {
        setStatus('error')
        setMessage(error.code === error.PERMISSION_DENIED ? 'Location permission denied' : 'Location unavailable')
        if (watchIdRef.current !== undefined) navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = undefined
      },
      { enableHighAccuracy: true, maximumAge: 3_000, timeout: 15_000 },
    )
  }, [active, onOrientation, status, transform])

  useEffect(() => {
    if (!active) stop()
    return stop
  }, [active, stop])

  useEffect(() => {
    if (!transform && (status === 'active' || status === 'acquiring')) stop()
  }, [status, stop, transform])

  return { status, position, message, start, stop }
}
