export type FestivalMapCalibrationPoint = {
  id: string
  latitude: number
  longitude: number
  accuracyMeters: number
  xPercent: number
  yPercent: number
  label?: string
  createdAt: string
  excluded?: boolean
}

export type FestivalMapCalibrationExport = {
  mapAsset: '/maps/lir26-map.jpg'
  points: FestivalMapCalibrationPoint[]
}

/**
 * Only field-verified points belong here. The illustrated map is not
 * georeferenced, so the application deliberately ships without guessed points.
 * Exported field calibration can be reviewed and committed here later.
 */
export const bundledFestivalMapCalibration: FestivalMapCalibrationExport = {
  mapAsset: '/maps/lir26-map.jpg',
  points: [],
}
