import { describe, expect, it } from 'vitest'
import { stages } from './thursdayTimetable'
import { mapStageLocations, mapStageLocationsById } from './mapStageLocations'

describe('festival map stage locations', () => {
  it('maps every timetable stage exactly once', () => {
    expect(new Set(mapStageLocations.map(({ timetableStageId }) => timetableStageId)).size)
      .toBe(mapStageLocations.length)
    expect(stages.every(({ id }) => mapStageLocationsById.has(id))).toBe(true)
  })

  it('keeps every highlight inside the map', () => {
    for (const location of mapStageLocations) {
      expect(location.xPercent).toBeGreaterThan(0)
      expect(location.xPercent).toBeLessThan(100)
      expect(location.yPercent).toBeGreaterThan(0)
      expect(location.yPercent).toBeLessThan(100)
    }
  })
})
