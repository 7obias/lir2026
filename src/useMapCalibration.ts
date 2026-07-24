import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type FestivalMapCalibrationExport,
  type FestivalMapCalibrationPoint,
} from './data/festivalMapCalibration'
import { calculateFestivalMapTransform, calibrationQuality } from './festivalMapGeo'

export const CALIBRATION_STORAGE_KEY = 'lir2026.map-calibration.v1'
export const DEFAULT_CALIBRATION_URL = `${import.meta.env.BASE_URL}maps/calibration.json`

export const parseCalibration = (value: string): FestivalMapCalibrationPoint[] => {
  const parsed = JSON.parse(value) as Partial<FestivalMapCalibrationExport>
  if (parsed.mapAsset !== '/maps/lir26-map.jpg' || !Array.isArray(parsed.points)) {
    throw new Error('This is not a LIR 2026 map calibration file')
  }
  const normalized: FestivalMapCalibrationPoint[] = []
  for (const point of parsed.points) {
    if (
      !point || typeof point.id !== 'string'
      || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)
      || (point.accuracyMeters !== undefined && !Number.isFinite(point.accuracyMeters))
      || !Number.isFinite(point.xPercent) || !Number.isFinite(point.yPercent)
      || point.latitude! < -90 || point.latitude! > 90
      || point.longitude! < -180 || point.longitude! > 180
      || (point.accuracyMeters !== undefined && point.accuracyMeters < 0)
      || point.xPercent! < 0 || point.xPercent! > 100
      || point.yPercent! < 0 || point.yPercent! > 100
      || typeof point.createdAt !== 'string'
    ) throw new Error('Calibration file contains an invalid point')
    normalized.push({
      ...point,
      source: point.source === 'current-location' ? 'current-location' : 'manual',
      enabled: point.enabled ?? !point.excluded,
    } as FestivalMapCalibrationPoint)
  }
  return normalized
}

export const readStoredCalibration = (
  storage: Pick<Storage, 'getItem'>,
): FestivalMapCalibrationPoint[] | undefined => {
  const saved = storage.getItem(CALIBRATION_STORAGE_KEY)
  return saved === null ? undefined : parseCalibration(saved)
}

export const loadDefaultCalibration = async (
  fetchCalibration: typeof fetch = fetch,
): Promise<FestivalMapCalibrationPoint[]> => {
  const response = await fetchCalibration(DEFAULT_CALIBRATION_URL)
  if (!response.ok) throw new Error('Default map calibration could not be loaded')
  return parseCalibration(await response.text())
}

type InitialCalibration = {
  points: FestivalMapCalibrationPoint[]
  needsDefault: boolean
}

const initialCalibration = (): InitialCalibration => {
  try {
    const stored = readStoredCalibration(localStorage)
    return stored === undefined
      ? { points: [], needsDefault: true }
      : { points: stored, needsDefault: false }
  } catch {
    return { points: [], needsDefault: true }
  }
}

export function useMapCalibration() {
  const initialRef = useRef<InitialCalibration>(initialCalibration())
  const [points, setPointsState] = useState<FestivalMapCalibrationPoint[]>(initialRef.current.points)
  const [storageMessage, setStorageMessage] = useState('')
  const historyRef = useRef<FestivalMapCalibrationPoint[][]>([])

  const persist = useCallback((next: FestivalMapCalibrationPoint[]) => {
    try {
      localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify({
        mapAsset: '/maps/lir26-map.jpg',
        points: next,
      } satisfies FestivalMapCalibrationExport))
      setStorageMessage('')
    } catch {
      setStorageMessage('Calibration could not be saved on this device')
    }
  }, [])

  useEffect(() => {
    if (!initialRef.current.needsDefault) return
    let cancelled = false

    loadDefaultCalibration()
      .then((defaults) => {
        if (cancelled) return
        try {
          if (localStorage.getItem(CALIBRATION_STORAGE_KEY) !== null) return
        } catch {
          // The defaults can still be used for this session when storage is unavailable.
        }
        setPointsState(defaults)
        persist(defaults)
      })
      .catch(() => {
        if (!cancelled) setStorageMessage('Default map calibration could not be loaded')
      })

    return () => {
      cancelled = true
    }
  }, [persist])

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

  const restoreDefaults = useCallback(async () => {
    const defaults = await loadDefaultCalibration()
    update(() => defaults)
  }, [update])

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
    restoreDefaults,
    undo,
    importJson,
    exportJson,
  }
}
