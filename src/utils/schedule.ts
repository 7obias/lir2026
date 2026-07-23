import { addMinutes, differenceInMinutes, isAfter, isBefore, isEqual, parseISO } from 'date-fns'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import type { Performance, UserSelection, UserSettings } from '../models'
import { FESTIVAL_TIMEZONE, routeKey } from '../models'

export const toDate = (iso: string) => parseISO(iso)
export const formatTime = (iso: string) => formatInTimeZone(toDate(iso), FESTIVAL_TIMEZONE, 'HH:mm')
export const formatFestivalDateTime = (date: Date) => formatInTimeZone(date, FESTIVAL_TIMEZONE, 'EEE, d MMM · HH:mm:ss')
export const festivalDate = (date: Date) => formatInTimeZone(date, FESTIVAL_TIMEZONE, 'yyyy-MM-dd')
export const localDateTimeToDate = (value: string) => fromZonedTime(value, FESTIVAL_TIMEZONE)
export const durationMinutes = (p: Performance) => differenceInMinutes(toDate(p.end), toDate(p.start))
export const crossesMidnight = (p: Performance) => festivalDate(toDate(p.start)) !== festivalDate(toDate(p.end))
export const sortChronologically = <T extends Performance>(items: T[]) =>
  [...items].sort((a, b) => toDate(a.start).getTime() - toDate(b.start).getTime())
export const overlaps = (a: Performance, b: Performance) =>
  isBefore(toDate(a.start), toDate(b.end)) && isBefore(toDate(b.start), toDate(a.end))
export const overlapMinutes = (a: Performance, b: Performance) =>
  Math.max(0, differenceInMinutes(
    new Date(Math.min(toDate(a.end).getTime(), toDate(b.end).getTime())),
    new Date(Math.max(toDate(a.start).getTime(), toDate(b.start).getTime()))
  ))
export const minutesBetween = (a: Performance, b: Performance) => differenceInMinutes(toDate(b.start), toDate(a.end))
export const transferMinutes = (from: string, to: string, settings: UserSettings) =>
  from === to ? 0 : settings.stageTransferTimes[routeKey(from, to)] ?? settings.defaultTransferMinutes
export const transferFeasible = (a: Performance, b: Performance, settings: UserSettings) =>
  minutesBetween(a, b) >= transferMinutes(a.stageId, b.stageId, settings)
export const recommendedDeparture = (next: Performance, transfer: number) => addMinutes(toDate(next.start), -transfer)
export const estimatedArrival = (departure: Date, transfer: number) => addMinutes(departure, transfer)
export const currentlyPlaying = (items: Performance[], now: Date) =>
  items.filter((p) => (isAfter(now, toDate(p.start)) || isEqual(now, toDate(p.start))) && isBefore(now, toDate(p.end)))
export const nextSelected = (items: Performance[], selections: UserSelection[], now: Date) => {
  const ids = new Set(selections.filter((s) => s.priority === 'must-see' || s.priority === 'interested').map((s) => s.performanceId))
  return sortChronologically(items.filter((p) => ids.has(p.id) && isAfter(toDate(p.start), now)))[0]
}
export const laterSelectedSameDay = (items: Performance[], selections: UserSelection[], now: Date, dayStart: string) => {
  const ids = new Set(selections.filter((s) => ['must-see', 'interested'].includes(s.priority)).map((s) => s.performanceId))
  return sortChronologically(items.filter((p) => ids.has(p.id) && p.start.startsWith(dayStart) && isAfter(toDate(p.start), now)))
}
export const splitSet = (first: Performance, second: Performance, transfer: number) => {
  const available = differenceInMinutes(toDate(second.end), toDate(first.start)) - transfer
  const firstShare = Math.max(0, Math.round(available / 2))
  const departure = addMinutes(toDate(first.start), firstShare)
  const arrival = addMinutes(departure, transfer)
  return {
    departure, arrival, transfer,
    firstMinutes: Math.min(durationMinutes(first), firstShare),
    secondMinutes: Math.max(0, differenceInMinutes(toDate(second.end), arrival))
  }
}
