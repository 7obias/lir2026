import { describe, expect, it } from 'vitest'
import {
  anchoredScrollOffset,
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

  it('preserves the exact horizontal stage coordinate around the fixed time rail', () => {
    const fixedRail = 34
    const startWidth = 844
    const nextWidth = 1688
    const startScroll = 120
    const startFocal = 300
    const movedFocal = 330
    const stageRatio = (nextWidth - fixedRail) / (startWidth - fixedRail)
    const nextScroll = anchoredScrollOffset(startScroll + startFocal, movedFocal, fixedRail, stageRatio)
    const before = (startScroll + startFocal - fixedRail) / (startWidth - fixedRail)
    const after = (nextScroll + movedFocal - fixedRail) / (nextWidth - fixedRail)
    expect(after).toBeCloseTo(before, 10)
  })

  it('preserves the exact vertical schedule coordinate below the sticky header', () => {
    const fixedHeader = 36
    const startScroll = 180
    const startFocal = 120
    const movedFocal = 105
    const ratio = 1.75
    const nextScroll = anchoredScrollOffset(startScroll + startFocal, movedFocal, fixedHeader, ratio)
    const before = startScroll + startFocal - fixedHeader
    const after = (nextScroll + movedFocal - fixedHeader) / ratio
    expect(after).toBeCloseTo(before, 10)
  })
})
