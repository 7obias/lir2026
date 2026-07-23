import type { Performance } from './data/thursdayTimetable'

export const PIXELS_PER_MINUTE = 0.72
export const TIME_COLUMN_WIDTH = 34

export function minutesFrom(origin: string, value: string): number {
  return (new Date(value).getTime() - new Date(origin).getTime()) / 60_000
}

export function blockPosition(performance: Performance, origin: string) {
  return {
    top: minutesFrom(origin, performance.start) * PIXELS_PER_MINUTE,
    height: minutesFrom(performance.start, performance.end) * PIXELS_PER_MINUTE,
  }
}

export function stageColumnWidth(viewportWidth: number): number {
  return (viewportWidth - TIME_COLUMN_WIDTH) / 7
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Prague',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}
