export type MapStageLocation = {
  timetableStageId: string
  mapLabel: string
  xPercent: number
  yPercent: number
  highlightWidthPercent?: number
  highlightHeightPercent?: number
}

// Coordinates measured from the official 10,000 × 5,625 map:
// https://letitroll.at/wp-content/uploads/maps/lir26_map.jpg
export const mapStageLocations: MapStageLocation[] = [
  { timetableStageId: 'generator', mapLabel: 'Generator', xPercent: 64.0, yPercent: 48.9, highlightWidthPercent: 5.5, highlightHeightPercent: 17 },
  { timetableStageId: 'factory', mapLabel: 'Factory', xPercent: 72.2, yPercent: 58.3, highlightWidthPercent: 4.8, highlightHeightPercent: 13 },
  { timetableStageId: 'sound-garden', mapLabel: 'Sound Garden', xPercent: 78.2, yPercent: 54.0, highlightWidthPercent: 6.2, highlightHeightPercent: 10 },
  { timetableStageId: 'archive', mapLabel: 'Archive', xPercent: 74.6, yPercent: 42.1, highlightWidthPercent: 5.2, highlightHeightPercent: 9 },
  { timetableStageId: 'bass-shelter', mapLabel: 'Bass Shelter', xPercent: 71.8, yPercent: 35.0, highlightWidthPercent: 4.8, highlightHeightPercent: 8 },
  { timetableStageId: 'port-stage', mapLabel: 'Port Stage', xPercent: 63.7, yPercent: 30.0, highlightWidthPercent: 4.2, highlightHeightPercent: 10 },
  { timetableStageId: 'saurus', mapLabel: 'Saurus', xPercent: 55.2, yPercent: 41.8, highlightWidthPercent: 3.8, highlightHeightPercent: 5 },
]

export const mapStageLocationsById = new Map(
  mapStageLocations.map((location) => [location.timetableStageId, location]),
)
