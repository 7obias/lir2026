import { describe, expect, it } from 'vitest'
import { festivalMapControlPoints } from './data/festivalMapCalibration'
import {
  accuracyEllipse,
  createMapProjection,
  smoothCoordinates,
  smoothHeading,
} from './festivalMapGeo'

describe('festival map calibration', () => {
  it('maps every calibration coordinate back to its measured image point', () => {
    const project = createMapProjection(festivalMapControlPoints)
    for (const point of festivalMapControlPoints) {
      expect(project(point.latitude, point.longitude)).toEqual({
        xPercent: expect.closeTo(point.xPercent, 5),
        yPercent: expect.closeTo(point.yPercent, 5),
      })
    }
  })

  it('converts GPS accuracy to a visible positive map ellipse', () => {
    const project = createMapProjection(festivalMapControlPoints)
    const ellipse = accuracyEllipse(project, 50.525, 13.66, 10)
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
