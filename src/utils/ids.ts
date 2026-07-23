const normalize = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const stablePerformanceId = (festivalId: string, day: string, stage: string, artist: string, start: string) =>
  [festivalId, day, stage, artist, start].map(normalize).join('__')
export const stableEntityId = (value: string) => normalize(value)
