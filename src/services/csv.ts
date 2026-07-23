import { fromZonedTime } from 'date-fns-tz'
import type { Artist, FestivalDay, Performance, Stage } from '../models'
import { FESTIVAL_TIMEZONE } from '../models'
import { stableEntityId, stablePerformanceId } from '../utils/ids'

export interface CsvError { row: number; message: string }
export interface CsvResult {
  days: FestivalDay[]; stages: Stage[]; artists: Artist[]; performances: Performance[]; errors: CsvError[]; duplicateCount: number
}
const expected = ['day', 'stage', 'artist', 'start', 'end', 'genres']

export const parseCsvLines = (text: string) => {
  const rows: string[][] = []; let row: string[] = []; let field = ''; let quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++ } else quoted = !quoted
    } else if (char === ',' && !quoted) { row.push(field.trim()); field = '' }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field.trim()); if (row.some(Boolean)) rows.push(row); row = []; field = ''
    } else field += char
  }
  row.push(field.trim()); if (row.some(Boolean)) rows.push(row)
  return rows
}
const validDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime())
const validTime = (v: string) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v)

export const parseTimetableCsv = (text: string, festivalId = 'lir-2026'): CsvResult => {
  const source = parseCsvLines(text.trim())
  if (!source.length) return { days: [], stages: [], artists: [], performances: [], errors: [{ row: 1, message: 'The CSV file is empty.' }], duplicateCount: 0 }
  const header = source[0].map((v) => v.toLowerCase())
  if (header.join('|') !== expected.join('|')) return { days: [], stages: [], artists: [], performances: [], errors: [{ row: 1, message: `Header must be exactly: ${expected.join(',')}` }], duplicateCount: 0 }
  const errors: CsvError[] = []; const performances: Performance[] = []; const seen = new Set<string>(); let duplicateCount = 0
  for (let i = 1; i < source.length; i++) {
    const values = source[i]; const rowNo = i + 1
    if (values.length !== 6) { errors.push({ row: rowNo, message: 'Expected 6 columns.' }); continue }
    const [day, stage, artist, start, end, genreValue] = values.map((v) => v.trim())
    if (!day || !stage || !artist || !start || !end) { errors.push({ row: rowNo, message: 'Day, stage, artist, start, and end are required.' }); continue }
    if (!validDate(day)) { errors.push({ row: rowNo, message: `Invalid date "${day}". Use YYYY-MM-DD.` }); continue }
    if (!validTime(start) || !validTime(end)) { errors.push({ row: rowNo, message: 'Invalid time. Use 24-hour HH:mm.' }); continue }
    if (start === end) { errors.push({ row: rowNo, message: 'Start and end time cannot be equal.' }); continue }
    const id = stablePerformanceId(festivalId, day, stage, artist, start)
    if (seen.has(id)) { errors.push({ row: rowNo, message: 'Duplicate timetable row.' }); duplicateCount++; continue }
    seen.add(id)
    const startLocal = `${day}T${start}:00`; const endDate = new Date(`${day}T12:00:00Z`)
    if (end <= start) endDate.setUTCDate(endDate.getUTCDate() + 1)
    const endDay = endDate.toISOString().slice(0, 10)
    performances.push({
      id, artistId: stableEntityId(artist), artistName: artist, stageId: stableEntityId(stage),
      start: fromZonedTime(startLocal, FESTIVAL_TIMEZONE).toISOString(),
      end: fromZonedTime(`${endDay}T${end}:00`, FESTIVAL_TIMEZONE).toISOString(),
      genres: genreValue ? genreValue.split(/[;|]/).map((g) => g.trim()).filter(Boolean) : []
    })
  }
  const dayValues = [...new Set(performances.map((p) => source.find((r, index) => index > 0 && stablePerformanceId(festivalId, r[0], r[1], r[2], r[3]) === p.id)?.[0] ?? ''))].sort()
  const stageValues = [...new Set(performances.map((p) => source.find((r, index) => index > 0 && stablePerformanceId(festivalId, r[0], r[1], r[2], r[3]) === p.id)?.[1] ?? ''))]
  const artistMap = new Map<string, Artist>()
  performances.forEach((p) => { const current = artistMap.get(p.artistId); artistMap.set(p.artistId, { id: p.artistId, name: p.artistName, genres: [...new Set([...(current?.genres ?? []), ...p.genres])] }) })
  return {
    days: dayValues.map((date, sortOrder) => ({ id: date, date, label: new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)), sortOrder })),
    stages: stageValues.map((name, sortOrder) => ({ id: stableEntityId(name), name, sortOrder })),
    artists: [...artistMap.values()], performances, errors, duplicateCount
  }
}
