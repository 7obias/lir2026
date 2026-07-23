import { beforeEach, describe, expect, it } from 'vitest'
import { demoData } from '../data/demoTimetable'
import { repository } from './repository'

describe('IndexedDB repository', () => {
  beforeEach(async () => {
    await repository.saveAll(structuredClone(demoData))
  })

  it('persists a selection separately from timetable data', async () => {
    const performanceId = demoData.performances[0].id
    await repository.saveSelection({ performanceId, priority: 'must-see', reminderMinutes: 20, notes: 'Front left', updatedAt: '2026-01-01T00:00:00Z' })
    const loaded = await repository.load()
    expect(loaded.performances).toHaveLength(demoData.performances.length)
    expect(loaded.selections).toEqual([expect.objectContaining({ performanceId, priority: 'must-see', notes: 'Front left' })])
  })

  it('preserves matching selections when replacing a timetable', async () => {
    const performanceId = demoData.performances[0].id
    await repository.saveSelection({ performanceId, priority: 'interested', reminderMinutes: 10, notes: '', updatedAt: '2026-01-01T00:00:00Z' })
    const preserved = await repository.replaceTimetable(demoData.festival, demoData.artists, demoData.performances.slice(0, 2))
    expect(preserved).toBe(1)
    expect((await repository.load()).selections[0].performanceId).toBe(performanceId)
  })
})
