import { describe, expect, it } from 'vitest'
import { parseCoordinatePair, validLatitude, validLongitude } from './calibrationCoordinates'

describe('map calibration coordinate entry', () => {
  it('parses latitude first and longitude second', () => {
    expect(parseCoordinatePair('50.522272, 13.646872')).toEqual({
      latitude: '50.522272',
      longitude: '13.646872',
    })
    expect(parseCoordinatePair('  (50.522276, 13.646852)  ')).toEqual({
      latitude: '50.522276',
      longitude: '13.646852',
    })
    expect(parseCoordinatePair('(50.522276,13.646852)')).toEqual({
      latitude: '50.522276',
      longitude: '13.646852',
    })
  })

  it('rejects malformed and out-of-range pairs', () => {
    expect(parseCoordinatePair('13.646872 50.522272')).toBeUndefined()
    expect(parseCoordinatePair('91, 13')).toBeUndefined()
    expect(parseCoordinatePair('50, 181')).toBeUndefined()
    expect(parseCoordinatePair('(50, 13')).toBeUndefined()
    expect(parseCoordinatePair('50, 13)')).toBeUndefined()
  })

  it('validates decimal-degree boundaries and finite values', () => {
    expect(validLatitude('-90')).toBe(true)
    expect(validLatitude('90')).toBe(true)
    expect(validLatitude('Infinity')).toBe(false)
    expect(validLongitude('-180')).toBe(true)
    expect(validLongitude('180')).toBe(true)
    expect(validLongitude('181')).toBe(false)
  })
})
