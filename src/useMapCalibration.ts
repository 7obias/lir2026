import { useCallback, useMemo, useRef, useState } from 'react'
import {
  bundledFestivalMapCalibration,
  type FestivalMapCalibrationExport,
  type FestivalMapCalibrationPoint,
} from './data/festivalMapCalibration'
import { calculateFestivalMapTransform, calibrationQuality } from './festivalMapGeo'

const STORAGE_KEY = 'lir2026.map-calibration.v1'

const parseCalibration = (value: string): FestivalMapCalibrationPoint[] => {
  const parsed = JSON.parse(value) as Partial<FestivalMapCalibrationExport>
  if (parsed.mapAsset !== '/maps/lir26-map.jpg' || !Array.isArray(parsed.points)) {
    throw new Error('This is not a LIR 2026 map calibration file')
  }
  for (const point of parsed.points) {
    if (
      !point || typeof point.id !== 'string'
      || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)
      || !Number.isFinite(point.accuracyMeters)
      || !Number.isFinite(point.xPercent) || !Number.isFinite(point.yPercent)
      || point.latitude! < -90 || point.latitude! > 90
      || point.longitude! < -180 || point.longitude! > 180
      || point.accuracyMeters! < 0
      || point.xPercent! < 0 || point.xPercent! > 100
      || point.yPercent! < 0 || point.yPercent! > 100
      || typeof point.createdAt !== 'string'
    ) throw new Error('Calibration file contains an invalid point')
  }
  return parsed.points as FestivalMapCalibrationPoint[]
}

const initialPoints = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? parseCalibration(saved) : bundledFestivalMapCalibration.points
  } catch {
    return bundledFestivalMapCalibration.points
  }
}

export const calibrationAdminEnabled = () => {
  const parameters = new URLSearchParams(window.location.search)
  return import.meta.env.DEV || parameters.get('mapCalibration') === '1'
}

export function useMapCalibration() {
  const [points, setPointsState] = useState<FestivalMapCalibrationPoint[]>(initialPoints)
  const [storageMessage, setStorageMessage] = useState('')
  const historyRef = useRef<FestivalMapCalibrationPoint[][]>([])

  const persist = useCallback((next: FestivalMapCalibrationPoint[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mapAsset: '/maps/lir26-map.jpg',
        points: next,
      } satisfies FestivalMapCalibrationExport))
      setStorageMessage('')
    } catch {
      setStorageMessage('Calibration could not be saved on this device')
    }
  }, [])

  const update = useCallback((
    updater: (current: FestivalMapCalibrationPoint[]) => FestivalMapCalibrationPoint[],
    recordHistory = true,
  ) => {
    setPointsState((current) => {
      const next = updater(current)
      if (next === current) return current
      if (recordHistory) historyRef.current.push(current)
      persist(next)
      return next
    })
  }, [persist])

  const transform = useMemo(() => calculateFestivalMapTransform(points), [points])
  const quality = useMemo(() => calibrationQuality(points, transform), [points, transform])

  const addPoint = useCallback((point: FestivalMapCalibrationPoint) => {
    update((current) => [...current, point])
  }, [update])

  const patchPoint = useCallback((
    id: string,
    patch: Partial<FestivalMapCalibrationPoint>,
    recordHistory = true,
  ) => {
    update(
      (current) => current.map((point) => point.id === id ? { ...point, ...patch } : point),
      recordHistory,
    )
  }, [update])

  const deletePoint = useCallback((id: string) => {
    update((current) => current.filter((point) => point.id !== id))
  }, [update])

  const reset = useCallback(() => update(() => []), [update])

  const undo = useCallback(() => {
    const previous = historyRef.current.pop()
    if (!previous) return
    setPointsState(previous)
    persist(previous)
  }, [persist])

  const checkpoint = useCallback(() => {
    historyRef.current.push(points)
  }, [points])

  const importJson = useCallback((json: string) => {
    const imported = parseCalibration(json)
    update(() => imported)
  }, [update])

  const exportJson = useCallback(() => JSON.stringify({
    mapAsset: '/maps/lir26-map.jpg',
    points,
  } satisfies FestivalMapCalibrationExport, null, 2), [points])

  return {
    points,
    transform,
    quality,
    storageMessage,
    canUndo: historyRef.current.length > 0,
    checkpoint,
    addPoint,
    patchPoint,
    deletePoint,
    reset,
    undo,
    importJson,
    exportJson,
  }
}
