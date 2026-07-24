import { describe, expect, it } from 'vitest'
import { THURSDAY_START } from './data/thursdayTimetable'
import { minutesFrom } from './timetable'
import { formatPragueDateTime, pragueLocalInputToDate } from './useActiveTime'

describe('active timetable time', () => {
  it('interprets datetime-local input in Europe/Prague rather than the device timezone', () => {
    expect(pragueLocalInputToDate('2026-07-30T22:00').toISOString()).toBe('2026-07-30T20:00:00.000Z')
  })

  it('formats Prague festival time with a 24-hour clock', () => {
    expect(formatPragueDateTime(new Date('2026-07-30T20:35:00.000Z'))).toBe('30 Jul 22:35')
  })

  it('rejects malformed simulated input', () => {
    expect(pragueLocalInputToDate('').getTime()).toBe(Number.NaN)
  })

  it('keeps after-midnight simulated time in the Thursday festival-night sequence', () => {
    const afterMidnight = pragueLocalInputToDate('2026-07-31T00:30')
    expect(minutesFrom(THURSDAY_START, afterMidnight.toISOString())).toBe(750)
  })
})
