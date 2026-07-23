import { describe, expect, it } from 'vitest'
import type { FestivalMapCalibrationPoint } from './data/festivalMapCalibration'
import {
  accuracyEllipse,
  calculateFestivalMapTransform,
  calibrationQuality,
  smoothCoordinates,
  smoothHeading,
} from './festivalMapGeo'

const point = (
  id: string,
  latitude: number,
  longitude: number,
  xPercent: number,
  yPercent: number,
): FestivalMapCalibrationPoint => ({
  id,
  latitude,
  longitude,
  accuracyMeters: 5,
  xPercent,
  yPercent,
  createdAt: '2026-07-23T12:00:00.000Z',
})

const points = [
  point('north-west', 50.530, 13.640, 20, 18),
  point('north-east', 50.530, 13.680, 82, 22),
  point('south-west', 50.510, 13.640, 17, 86),
  point('south-east', 50.510, 13.680, 79, 90),
]

describe('festival map calibration', () => {
  it('does not produce a transform with fewer than two points', () => {
    expect(calculateFestivalMapTransform([])).toBeUndefined()
    expect(calculateFestivalMapTransform(points.slice(0, 1))).toBeUndefined()
  })

  it('uses a provisional similarity transform for two points', () => {
    const transform = calculateFestivalMapTransform(points.slice(0, 2))
    expect(transform?.model).toBe('similarity')
    expect(transform?.project(points[0].latitude, points[0].longitude)).toEqual({
      xPercent: expect.closeTo(points[0].xPercent, 5),
      yPercent: expect.closeTo(points[0].yPercent, 5),
    })
    expect(calibrationQuality(points.slice(0, 2), transform).status).toBe('Provisional')
  })

  it('least-squares fits four well-separated points with an affine transform', () => {
    const transform = calculateFestivalMapTransform(points)
    expect(transform?.model).toBe('affine')
    expect(transform?.averageErrorMeters).toBeLessThan(0.1)
    expect(transform?.residuals).toHaveLength(4)
  })

  it('ignores excluded points', () => {
    const transform = calculateFestivalMapTransform([
      ...points,
      { ...point('bad', 50.52, 13.66, 99, 1), excluded: true },
    ])
    expect(transform?.residuals).toHaveLength(4)
  })

  it('converts GPS accuracy to a positive map ellipse', () => {
    const transform = calculateFestivalMapTransform(points)
    expect(transform).toBeDefined()
    const ellipse = accuracyEllipse(transform!.project, 50.52, 13.66, 10)
    expect(ellipse.widthPercent).toBeGreaterThan(0)
    expect(ellipse.heightPercent).toBeGreaterThan(0)
  })
})

describe('live position smoothing', () => {
  it('dampens a small GPS jump', () => {
    const previous = { latitude: 50.52, longitude: 13.65 }
    const next = { latitude: 50.52001, longitude: 13.65001, accuracy: 8 }
    const smoothed = smoothCoordinates(previous, next)
    expect(smoothed.latitude).toBeGreaterThan(previous.latitude)
    expect(smoothed.latitude).toBeLessThan(next.latitude)
  })

  it('smooths heading across north without rotating the long way around', () => {
    const heading = smoothHeading(358, 2)
    expect(heading).toBeGreaterThan(358)
    expect(heading).toBeLessThan(360)
  })
})
