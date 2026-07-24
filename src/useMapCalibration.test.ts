import { readFile } from 'node:fs/promises'
import { describe, expect, it, vi } from 'vitest'
import { calculateFestivalMapTransform } from './festivalMapGeo'
import {
  CALIBRATION_STORAGE_KEY,
  DEFAULT_CALIBRATION_URL,
  loadDefaultCalibration,
  readStoredCalibration,
} from './useMapCalibration'

const bundledJson = await readFile(
  new URL('../public/maps/calibration.json', import.meta.url),
  'utf8',
)

const storageWith = (value: string | null): Pick<Storage, 'getItem'> => ({
  getItem: (key) => key === CALIBRATION_STORAGE_KEY ? value : null,
})

describe('map calibration defaults', () => {
  it('loads and validates the bundled calibration from its public URL', async () => {
    const fetchCalibration = vi.fn(async () => new Response(bundledJson, { status: 200 }))
    const points = await loadDefaultCalibration(fetchCalibration)

    expect(fetchCalibration).toHaveBeenCalledWith(DEFAULT_CALIBRATION_URL)
    expect(points).toHaveLength(3)
    expect(calculateFestivalMapTransform(points)?.model).toBe('affine')
  })

  it('reports that defaults are needed only when the local key is absent', () => {
    expect(readStoredCalibration(storageWith(null))).toBeUndefined()

    const stored = readStoredCalibration(storageWith(bundledJson))
    expect(stored).toHaveLength(3)
  })

  it('preserves an explicitly stored empty calibration', () => {
    const stored = readStoredCalibration(storageWith(JSON.stringify({
      mapAsset: '/maps/lir26-map.jpg',
      points: [],
    })))

    expect(stored).toEqual([])
  })
})
