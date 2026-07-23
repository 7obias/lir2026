import { fromZonedTime } from 'date-fns-tz'
import type { AppData, Artist, Festival, Performance, Stage } from '../models'
import { DB_SCHEMA_VERSION, FESTIVAL_TIMEZONE, defaultSettings } from '../models'
import { stableEntityId, stablePerformanceId } from '../utils/ids'

const dayDefs = [
  ['2026-07-30', 'Thursday', 0],
  ['2026-07-31', 'Friday', 1],
  ['2026-08-01', 'Saturday', 2]
] as const
const stageNames = ['Mothership', 'Temple', 'Citadel', 'Dockyard']
export const demoStages: Stage[] = stageNames.map((name, sortOrder) => ({ id: stableEntityId(name), name, sortOrder }))
const acts = [
  ['Aphrodite', 'jungle'], ['Annix', 'drum & bass'], ['Buunshin', 'experimental dnb'], ['Current Value', 'neurofunk'],
  ['Fade Black', 'drum & bass'], ['Fox Stevenson', 'dancefloor'], ['Signal Drift', 'liquid'], ['Night Circuit', 'techstep'],
  ['Glass Cobra', 'neurofunk'], ['Echo Unit', 'jungle'], ['Static Bloom', 'liquid'], ['Delta Sequence', 'rollers']
] as const
const utcIso = (day: string, time: string, nextDay = false) => {
  const base = new Date(`${day}T12:00:00Z`)
  if (nextDay) base.setUTCDate(base.getUTCDate() + 1)
  const d = base.toISOString().slice(0, 10)
  return fromZonedTime(`${d}T${time}:00`, FESTIVAL_TIMEZONE).toISOString()
}
const rows: Performance[] = []
dayDefs.forEach(([day], dayIndex) => {
  demoStages.forEach((stage, stageIndex) => {
    const starts = ['20:00', '21:15', '22:30', '23:45']
    starts.forEach((start, slot) => {
      const [artistName, genre] = acts[(dayIndex * 4 + stageIndex * 2 + slot) % acts.length]
      const hour = Number(start.slice(0, 2)); const minute = Number(start.slice(3))
      const total = hour * 60 + minute + (slot === 3 ? 90 : 60)
      const end = `${String(Math.floor((total / 60) % 24)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
      rows.push({
        id: stablePerformanceId('lir-2026', day, stage.name, artistName, start),
        artistId: stableEntityId(artistName), artistName, stageId: stage.id,
        start: utcIso(day, start), end: utcIso(day, end, total >= 1440), genres: [genre],
        description: slot === 0 ? 'Demo performance for planning and testing.' : undefined
      })
    })
  })
})
export const demoArtists: Artist[] = acts.map(([name, genre]) => ({ id: stableEntityId(name), name, genres: [genre] }))
export const demoFestival: Festival = {
  id: 'lir-2026', name: 'LIR 2026 Planner', venue: 'Lake Most', timezone: FESTIVAL_TIMEZONE,
  days: dayDefs.map(([date, label, sortOrder]) => ({ id: date, date, label, sortOrder })),
  stages: demoStages, dataSource: 'demo', importedAt: new Date('2026-01-01T00:00:00Z').toISOString(), schemaVersion: DB_SCHEMA_VERSION
}
export const demoData: AppData = { festival: demoFestival, artists: demoArtists, performances: rows, selections: [], settings: defaultSettings }
