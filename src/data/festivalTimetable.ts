import additionalTimetable from './additionalTimetable.json'
import {
  performances as thursdayPerformances,
  stages as thursdayStages,
  THURSDAY_END,
  THURSDAY_START,
  type Performance,
  type Stage,
} from './thursdayTimetable'

// Source: https://letitroll.eu/time/
// Friday and Saturday were extracted from the official tables' stage columns and
// explicit data-start/data-end attributes. The app never fetches them at runtime.

export type { Performance, Stage } from './thursdayTimetable'

export type FestivalDay = {
  id: string
  date: string
  label: string
  start: string
  end: string
  stages: Stage[]
  performances: Performance[]
}

type RawTimetableDay = {
  date: string
  headers: string[]
  events: Array<{
    stage: string
    artist: string
    start: string
    end: string
  }>
}

const stageNames: Record<string, { id: string; name: string }> = {
  GENERATOR: { id: 'generator', name: 'Generator' },
  FACTORY: { id: 'factory', name: 'Factory' },
  'SOUND GARDEN': { id: 'sound-garden', name: 'Sound Garden' },
  ARCHIVE: { id: 'archive', name: 'Archive' },
  'BASS SHELTER': { id: 'bass-shelter', name: 'Bass Shelter' },
  'PORT STAGE': { id: 'port-stage', name: 'Port Stage' },
  SAURUS: { id: 'saurus', name: 'Saurus' },
}

const splitStageHeader = (header: string) => {
  const [baseName, subtitle] = header.split(' | ')
  const identity = stageNames[baseName]
  if (!identity) throw new Error(`Unknown timetable stage: ${baseName}`)
  return { ...identity, subtitle }
}

const nextIsoDate = (date: string) => {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + 1)
  return value.toISOString().slice(0, 10)
}

const festivalTimestamp = (date: string, time: string) => {
  const hour = Number(time.slice(0, 2))
  const calendarDate = hour < 10 ? nextIsoDate(date) : date
  return `${calendarDate}T${time}:00+02:00`
}

const slug = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const weekdayLabel = (date: string) => new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  timeZone: 'Europe/Prague',
}).format(new Date(`${date}T12:00:00+02:00`))

const buildAdditionalDay = (raw: RawTimetableDay): FestivalDay => {
  const stages = raw.headers.map((header, order) => ({
    ...splitStageHeader(header),
    order,
  }))
  const stageByHeader = new Map(raw.headers.map((header, index) => [header, stages[index]]))
  const performances = raw.events.map((event) => {
    const stage = stageByHeader.get(event.stage)
    if (!stage) throw new Error(`Unknown stage header: ${event.stage}`)
    return {
      id: `${raw.date}-${stage.id}-${event.start.replace(':', '')}-${slug(event.artist)}`,
      artist: event.artist,
      stageId: stage.id,
      start: festivalTimestamp(raw.date, event.start),
      end: festivalTimestamp(raw.date, event.end),
    }
  })
  const timestamps = performances.flatMap(({ start, end }) => [
    new Date(start).getTime(),
    new Date(end).getTime(),
  ])
  const first = new Date(Math.min(...timestamps))
  first.setMinutes(0, 0, 0)

  return {
    id: raw.date,
    date: raw.date,
    label: weekdayLabel(raw.date),
    start: first.toISOString(),
    end: new Date(Math.max(...timestamps)).toISOString(),
    stages,
    performances,
  }
}

export const festivalDays: FestivalDay[] = [
  {
    id: '2026-07-30',
    date: '2026-07-30',
    label: 'Thursday',
    start: THURSDAY_START,
    end: THURSDAY_END,
    stages: thursdayStages,
    performances: thursdayPerformances,
  },
  ...(additionalTimetable as RawTimetableDay[]).map(buildAdditionalDay),
]

export const allPerformances = festivalDays.flatMap(({ performances }) => performances)
