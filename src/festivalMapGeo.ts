import type { FestivalMapCalibrationPoint } from './data/festivalMapCalibration'

export type MapPoint = { xPercent: number; yPercent: number }
export type LocalPoint = { eastMetres: number; northMetres: number }
export type CalibrationModelName = 'none' | 'similarity' | 'affine'

type Coefficients = [number, number, number]

export type CalibrationResidual = {
  id: string
  predicted: MapPoint
  errorPercent: number
  errorMeters: number
  likelyIncorrect: boolean
}

export type FestivalMapTransform = {
  model: Exclude<CalibrationModelName, 'none'>
  project: (latitude: number, longitude: number) => MapPoint
  residuals: CalibrationResidual[]
  averageErrorMeters: number
  maximumErrorMeters: number
}

export type CalibrationQuality = {
  activeCount: number
  model: CalibrationModelName
  status: 'Not calibrated' | 'Provisional' | 'Usable' | 'Poor calibration' | 'Good calibration'
  progress: string
  averageErrorMeters?: number
  maximumErrorMeters?: number
  clustered: boolean
}

const EARTH_RADIUS_METRES = 6_371_000

export const localProjection = (latitudeOrigin: number, longitudeOrigin: number) =>
  (latitude: number, longitude: number): LocalPoint => {
    const radians = Math.PI / 180
    return {
      eastMetres: (longitude - longitudeOrigin) * radians
        * EARTH_RADIUS_METRES * Math.cos(latitudeOrigin * radians),
      northMetres: (latitude - latitudeOrigin) * radians * EARTH_RADIUS_METRES,
    }
  }

const solve3 = (rows: number[][], values: number[]): Coefficients => {
  const matrix = rows.map((row, index) => [...row, values[index]])
  for (let column = 0; column < 3; column += 1) {
    let pivot = column
    for (let row = column + 1; row < 3; row += 1) {
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row
    }
    ;[matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]]
    const divisor = matrix[column][column]
    if (Math.abs(divisor) < 1e-9) throw new Error('Calibration points need wider separation')
    for (let index = column; index < 4; index += 1) matrix[column][index] /= divisor
    for (let row = 0; row < 3; row += 1) {
      if (row === column) continue
      const factor = matrix[row][column]
      for (let index = column; index < 4; index += 1) matrix[row][index] -= factor * matrix[column][index]
    }
  }
  return [matrix[0][3], matrix[1][3], matrix[2][3]]
}

const leastSquares = (rows: number[][], values: number[]): Coefficients => {
  const normalRows = Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 3 }, (_, column) =>
      rows.reduce((sum, current) => sum + current[row] * current[column], 0)))
  const normalValues = Array.from({ length: 3 }, (_, column) =>
    rows.reduce((sum, current, index) => sum + current[column] * values[index], 0))
  return solve3(normalRows, normalValues)
}

const inverseErrorMetres = (
  x: Coefficients,
  y: Coefficients,
  xError: number,
  yError: number,
) => {
  const determinant = x[0] * y[1] - x[1] * y[0]
  if (Math.abs(determinant) < 1e-10) return Number.POSITIVE_INFINITY
  const east = (y[1] * xError - x[1] * yError) / determinant
  const north = (-y[0] * xError + x[0] * yError) / determinant
  return Math.hypot(east, north)
}

const maximumSiteSeparation = (points: FestivalMapCalibrationPoint[]) => {
  if (points.length < 2) return 0
  const latitudeOrigin = points.reduce((sum, point) => sum + point.latitude, 0) / points.length
  const longitudeOrigin = points.reduce((sum, point) => sum + point.longitude, 0) / points.length
  const local = localProjection(latitudeOrigin, longitudeOrigin)
  const projected = points.map((point) => local(point.latitude, point.longitude))
  let maximum = 0
  for (const first of projected) {
    for (const second of projected) {
      maximum = Math.max(maximum, Math.hypot(
        first.eastMetres - second.eastMetres,
        first.northMetres - second.northMetres,
      ))
    }
  }
  return maximum
}

export const calculateFestivalMapTransform = (
  allPoints: FestivalMapCalibrationPoint[],
): FestivalMapTransform | undefined => {
  const points = allPoints.filter((point) => point.enabled !== false && !point.excluded)
  if (points.length < 2) return undefined
  const latitudeOrigin = points.reduce((sum, point) => sum + point.latitude, 0) / points.length
  const longitudeOrigin = points.reduce((sum, point) => sum + point.longitude, 0) / points.length
  const toLocal = localProjection(latitudeOrigin, longitudeOrigin)
  const locals = points.map((point) => toLocal(point.latitude, point.longitude))

  let x: Coefficients
  let y: Coefficients
  let model: FestivalMapTransform['model']
  if (points.length === 2) {
    model = 'similarity'
    const [first, second] = points
    const [firstLocal, secondLocal] = locals
    const east = secondLocal.eastMetres - firstLocal.eastMetres
    const north = secondLocal.northMetres - firstLocal.northMetres
    const xDifference = second.xPercent - first.xPercent
    const yDifference = second.yPercent - first.yPercent
    const denominator = east * east + north * north
    if (denominator < 1) return undefined
    const a = (xDifference * east + yDifference * north) / denominator
    const b = (yDifference * east - xDifference * north) / denominator
    x = [a, -b, first.xPercent - a * firstLocal.eastMetres + b * firstLocal.northMetres]
    y = [b, a, first.yPercent - b * firstLocal.eastMetres - a * firstLocal.northMetres]
  } else {
    model = 'affine'
    const rows = locals.map(({ eastMetres, northMetres }) => [eastMetres, northMetres, 1])
    x = leastSquares(rows, points.map(({ xPercent }) => xPercent))
    y = leastSquares(rows, points.map(({ yPercent }) => yPercent))
  }

  const project = (latitude: number, longitude: number): MapPoint => {
    const local = toLocal(latitude, longitude)
    return {
      xPercent: x[0] * local.eastMetres + x[1] * local.northMetres + x[2],
      yPercent: y[0] * local.eastMetres + y[1] * local.northMetres + y[2],
    }
  }
  const rawResiduals = points.map((point) => {
    const predicted = project(point.latitude, point.longitude)
    const xError = predicted.xPercent - point.xPercent
    const yError = predicted.yPercent - point.yPercent
    return {
      id: point.id,
      predicted,
      errorPercent: Math.hypot(xError, yError),
      errorMeters: inverseErrorMetres(x, y, xError, yError),
    }
  })
  const finiteErrors = rawResiduals.map(({ errorMeters }) => errorMeters).filter(Number.isFinite)
  const averageErrorMeters = finiteErrors.length
    ? finiteErrors.reduce((sum, error) => sum + error, 0) / finiteErrors.length
    : Number.POSITIVE_INFINITY
  const maximumErrorMeters = finiteErrors.length ? Math.max(...finiteErrors) : Number.POSITIVE_INFINITY
  const likelyThreshold = Math.max(12, averageErrorMeters * 2.5)
  const residuals = rawResiduals.map((residual) => ({
    ...residual,
    likelyIncorrect: residual.errorMeters > likelyThreshold,
  }))
  return { model, project, residuals, averageErrorMeters, maximumErrorMeters }
}

export const calibrationQuality = (
  points: FestivalMapCalibrationPoint[],
  transform = calculateFestivalMapTransform(points),
): CalibrationQuality => {
  const activePoints = points.filter((point) => point.enabled !== false && !point.excluded)
  const activeCount = activePoints.length
  const clustered = activeCount >= 2 && maximumSiteSeparation(activePoints) < 75
  if (activeCount < 2 || !transform) {
    return {
      activeCount,
      model: 'none',
      status: 'Not calibrated',
      progress: activeCount === 0
        ? 'Calibration points: 0 — add at least 3'
        : 'Calibration points: 1 — add at least 2 more',
      clustered,
    }
  }
  if (activeCount === 2) {
    return {
      activeCount,
      model: 'similarity',
      status: 'Provisional',
      progress: 'Calibration points: 2 — add at least 1 more',
      averageErrorMeters: transform.averageErrorMeters,
      maximumErrorMeters: transform.maximumErrorMeters,
      clustered,
    }
  }
  const error = transform.averageErrorMeters
  const status = error <= 10 && !clustered
    ? 'Good calibration'
    : error <= 25 && !clustered ? 'Usable' : 'Poor calibration'
  return {
    activeCount,
    model: 'affine',
    status,
    progress: activeCount === 3
      ? 'Calibration points: 3 — usable; 4+ recommended'
      : `Calibration points: ${activeCount}`,
    averageErrorMeters: transform.averageErrorMeters,
    maximumErrorMeters: transform.maximumErrorMeters,
    clustered,
  }
}

export const distanceMetres = (
  first: Pick<GeolocationCoordinates, 'latitude' | 'longitude'>,
  second: Pick<GeolocationCoordinates, 'latitude' | 'longitude'>,
) => {
  const latitudeOrigin = (first.latitude + second.latitude) / 2
  const local = localProjection(latitudeOrigin, first.longitude)
  const delta = local(second.latitude, second.longitude)
  return Math.hypot(delta.eastMetres, delta.northMetres)
}

export const smoothCoordinates = (
  previous: Pick<GeolocationCoordinates, 'latitude' | 'longitude'> | undefined,
  next: Pick<GeolocationCoordinates, 'latitude' | 'longitude' | 'accuracy'>,
) => {
  if (!previous) return { latitude: next.latitude, longitude: next.longitude }
  const alpha = distanceMetres(previous, next) > Math.max(12, next.accuracy * 0.7) ? 0.72 : 0.28
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
  project: (latitude: number, longitude: number) => MapPoint,
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
