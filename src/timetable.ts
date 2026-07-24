import type { Performance } from './data/festivalTimetable'

export const PIXELS_PER_MINUTE = 0.72
export const TIME_COLUMN_WIDTH = 34
export const STAGE_HEADER_HEIGHT = 36
export type PerformanceStatus = 'past' | 'current' | 'future'

export function minutesFrom(origin: string, value: string): number {
  return (new Date(value).getTime() - new Date(origin).getTime()) / 60_000
}

export function blockPosition(performance: Performance, origin: string) {
  return {
    top: minutesFrom(origin, performance.start) * PIXELS_PER_MINUTE,
    height: minutesFrom(performance.start, performance.end) * PIXELS_PER_MINUTE,
  }
}

export function stageColumnWidth(viewportWidth: number, stageCount = 7): number {
  return (viewportWidth - TIME_COLUMN_WIDTH) / stageCount
}

export function performanceStatus(performance: Performance, activeTime: Date): PerformanceStatus {
  const active = activeTime.getTime()
  const start = new Date(performance.start).getTime()
  const end = new Date(performance.end).getTime()
  if (start <= active && active < end) return 'current'
  if (end <= active) return 'past'
  return 'future'
}

export function toggleSetMembership(current: ReadonlySet<string>, value: string): Set<string> {
  const next = new Set(current)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Prague',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}
