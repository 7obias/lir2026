import { describe, expect, it } from 'vitest'
import {
  clampZoomScale,
  MAX_TIMETABLE_SCALE,
  MIN_TIMETABLE_SCALE,
  zoomFromDistances,
} from './useTimetableZoom'

describe('timetable pinch zoom calculations', () => {
  it('scales proportionally from the initial finger distance', () => {
    expect(zoomFromDistances(1, 100, 175)).toBe(1.75)
    expect(zoomFromDistances(1.5, 100, 50)).toBe(MIN_TIMETABLE_SCALE)
  })

  it('clamps the central zoom state to its supported range', () => {
    expect(clampZoomScale(0.2)).toBe(MIN_TIMETABLE_SCALE)
    expect(clampZoomScale(8)).toBe(MAX_TIMETABLE_SCALE)
  })
})
