import { describe, expect, it } from 'vitest'
import type { Performance } from '../models'
import { defaultSettings } from '../models'
import { crossesMidnight, currentlyPlaying, formatTime, minutesBetween, nextSelected, overlapMinutes, overlaps, recommendedDeparture, sortChronologically, transferFeasible, transferMinutes } from './schedule'
const p = (id: string, start: string, end: string, stageId = 'a'): Performance => ({ id, artistId: id, artistName: id, stageId, start, end, genres: [] })
const a = p('a', '2026-07-30T20:00:00Z', '2026-07-30T21:00:00Z')
describe('schedule utilities', () => {
  it('detects overlap and duration', () => { const b = p('b','2026-07-30T20:35:00Z','2026-07-30T21:30:00Z'); expect(overlaps(a,b)).toBe(true); expect(overlapMinutes(a,b)).toBe(25) })
  it('handles no overlap and exact boundaries', () => { const b = p('b','2026-07-30T21:00:00Z','2026-07-30T22:00:00Z'); expect(overlaps(a,b)).toBe(false); expect(overlapMinutes(a,b)).toBe(0) })
  it('recognizes and sorts cross-midnight sets', () => { const late = p('late','2026-07-30T21:30:00Z','2026-07-30T23:30:00Z'); expect(crossesMidnight(late)).toBe(true); expect(sortChronologically([a,late]).map((x) => x.id)).toEqual(['a','late']) })
  it('looks up directional transfers and falls back', () => { const settings = { ...defaultSettings, stageTransferTimes: { 'a→b': 18 } }; expect(transferMinutes('a','b',settings)).toBe(18); expect(transferMinutes('b','a',settings)).toBe(10); expect(transferMinutes('a','a',settings)).toBe(0) })
  it('warns on insufficient transfer', () => { const b = p('b','2026-07-30T21:05:00Z','2026-07-30T22:00:00Z','b'); expect(minutesBetween(a,b)).toBe(5); expect(transferFeasible(a,b,defaultSettings)).toBe(false) })
  it('calculates departure', () => { expect(formatTime(recommendedDeparture(p('b','2026-07-30T22:00:00Z','2026-07-30T23:00:00Z'),15).toISOString())).toBe('23:45') })
  it('finds current and next selected', () => { const b = p('b','2026-07-30T21:10:00Z','2026-07-30T22:00:00Z'); const now = new Date('2026-07-30T20:30:00Z'); expect(currentlyPlaying([a,b],now)).toEqual([a]); expect(nextSelected([a,b],[{ performanceId:'b',priority:'must-see',reminderMinutes:10,notes:'',updatedAt:''}],now)?.id).toBe('b') })
})
