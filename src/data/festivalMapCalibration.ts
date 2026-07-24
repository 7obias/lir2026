export type FestivalMapCalibrationPoint = {
  id: string
  latitude: number
  longitude: number
  accuracyMeters?: number
  xPercent: number
  yPercent: number
  source: 'current-location' | 'manual'
  enabled: boolean
  label?: string
  createdAt: string
  /** Compatibility with exports created before the simplified workflow. */
  excluded?: boolean
}

export type FestivalMapCalibrationExport = {
  mapAsset: '/maps/lir26-map.jpg'
  points: FestivalMapCalibrationPoint[]
}
