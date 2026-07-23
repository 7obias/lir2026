import type { FestivalMapControlPoint } from './data/festivalMapCalibration'

export type MapPoint = {
  xPercent: number
  yPercent: number
}

type AffineCoefficients = [number, number, number]

const solve3 = (
  rows: [number, number, number][],
  values: number[],
): AffineCoefficients => {
  const matrix = rows.map((row, index) => [...row, values[index]])

  for (let column = 0; column < 3; column += 1) {
    let pivot = column
    for (let row = column + 1; row < 3; row += 1) {
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row
    }
    ;[matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]]
    const divisor = matrix[column][column]
    if (Math.abs(divisor) < 1e-12) throw new Error('Map calibration points are collinear')
    for (let index = column; index < 4; index += 1) matrix[column][index] /= divisor
    for (let row = 0; row < 3; row += 1) {
      if (row === column) continue
      const factor = matrix[row][column]
      for (let index = column; index < 4; index += 1) {
        matrix[row][index] -= factor * matrix[column][index]
      }
    }
  }

  return [matrix[0][3], matrix[1][3], matrix[2][3]]
}

export const createMapProjection = (controlPoints: FestivalMapControlPoint[]) => {
  if (controlPoints.length < 3) throw new Error('At least three map control points are required')
  const points = controlPoints.slice(0, 3)
  const rows = points.map(({ longitude, latitude }) =>
    [longitude, latitude, 1] as [number, number, number])
  const x = solve3(rows, points.map(({ xPercent }) => xPercent))
  const y = solve3(rows, points.map(({ yPercent }) => yPercent))

  return (latitude: number, longitude: number): MapPoint => ({
    xPercent: x[0] * longitude + x[1] * latitude + x[2],
    yPercent: y[0] * longitude + y[1] * latitude + y[2],
  })
}

export const distanceMetres = (
  first: Pick<GeolocationCoordinates, 'latitude' | 'longitude'>,
  second: Pick<GeolocationCoordinates, 'latitude' | 'longitude'>,
) => {
  const toRadians = Math.PI / 180
  const latitudeDelta = (second.latitude - first.latitude) * toRadians
  const longitudeDelta = (second.longitude - first.longitude) * toRadians
  const latitude = (first.latitude + second.latitude) / 2 * toRadians
  const x = longitudeDelta * Math.cos(latitude)
  return Math.hypot(x, latitudeDelta) * 6_371_000
}

export const smoothCoordinates = (
  previous: Pick<GeolocationCoordinates, 'latitude' | 'longitude'> | undefined,
  next: Pick<GeolocationCoordinates, 'latitude' | 'longitude' | 'accuracy'>,
) => {
  if (!previous) return { latitude: next.latitude, longitude: next.longitude }
  const movement = distanceMetres(previous, next)
  const alpha = movement > Math.max(12, next.accuracy * 0.7) ? 0.72 : 0.28
  return {
    latitude: previous.latitude + (next.latitude - previous.latitude) * alpha,
    longitude: previous.longitude + (next.longitude - previous.longitude) * alpha,
  }
}

export const normalizeHeading = (heading: number) => ((heading % 360) + 360) % 360

export const smoothHeading = (previous: number | undefined, next: number) => {
  if (previous === undefined) return normalizeHeading(next)
  const delta = ((normalizeHeading(next) - previous + 540) % 360) - 180
  return normalizeHeading(previous + delta * 0.22)
}

export const accuracyEllipse = (
  project: ReturnType<typeof createMapProjection>,
  latitude: number,
  longitude: number,
  accuracyMetres: number,
) => {
  const metresPerLatitudeDegree = 111_320
  const metresPerLongitudeDegree = metresPerLatitudeDegree * Math.cos(latitude * Math.PI / 180)
  const centre = project(latitude, longitude)
  const east = project(latitude, longitude + accuracyMetres / metresPerLongitudeDegree)
  const north = project(latitude + accuracyMetres / metresPerLatitudeDegree, longitude)
  return {
    widthPercent: Math.max(0.15, Math.hypot(east.xPercent - centre.xPercent, east.yPercent - centre.yPercent) * 2),
    heightPercent: Math.max(0.15, Math.hypot(north.xPercent - centre.xPercent, north.yPercent - centre.yPercent) * 2),
  }
}
