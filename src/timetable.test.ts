import { describe, expect, it } from 'vitest'
import { performances, stages, THURSDAY_END, THURSDAY_START } from './data/thursdayTimetable'
import { blockPosition, minutesFrom, performanceStatus, PIXELS_PER_MINUTE, stageColumnWidth, toggleSetMembership } from './timetable'

describe('official Thursday timetable data', () => {
  it('uses known stages, unique IDs, valid ranges, and the Thursday festival window', () => {
    const stageIds = new Set(stages.map((stage) => stage.id))
    const ids = new Set<string>()

    for (const performance of performances) {
      expect(stageIds.has(performance.stageId)).toBe(true)
      expect(ids.has(performance.id)).toBe(false)
      expect(new Date(performance.start).getTime()).toBeLessThan(new Date(performance.end).getTime())
      expect(new Date(performance.start).getTime()).toBeGreaterThanOrEqual(new Date(THURSDAY_START).getTime())
      expect(new Date(performance.end).getTime()).toBeLessThanOrEqual(new Date(THURSDAY_END).getTime())
      ids.add(performance.id)
    }
  })

  it('represents all seven expected stages without same-stage overlaps', () => {
    expect(stages.map((stage) => stage.name)).toEqual([
      'Generator', 'Factory', 'Sound Garden', 'Archive', 'Bass Shelter', 'Port Stage', 'Saurus',
    ])

    for (const stage of stages) {
      const stageSets = performances
        .filter((performance) => performance.stageId === stage.id)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      expect(stageSets.length).toBeGreaterThan(0)
      for (let index = 1; index < stageSets.length; index += 1) {
        expect(new Date(stageSets[index - 1].end).getTime()).toBeLessThanOrEqual(new Date(stageSets[index].start).getTime())
      }
    }
  })
})

describe('timeline positioning', () => {
  it('maps timestamps and durations to proportional vertical pixels', () => {
    const performance = performances.find((item) => item.id === 'generator-2045-fox-stevenson')
    expect(performance).toBeDefined()
    expect(minutesFrom(THURSDAY_START, performance!.start)).toBe(525)
    expect(blockPosition(performance!, THURSDAY_START)).toEqual({
      top: 525 * PIXELS_PER_MINUTE,
      height: 60 * PIXELS_PER_MINUTE,
    })
  })

  it('places after-midnight sets after late Thursday sets', () => {
    const sota = performances.find((item) => item.id === 'generator-0000-sota')!
    const amc = performances.find((item) => item.id === 'generator-2300-amc-phantom')!
    expect(blockPosition(sota, THURSDAY_START).top).toBeGreaterThan(blockPosition(amc, THURSDAY_START).top)
  })

  it.each([932, 844, 852])('fits the time column and seven readable stage columns at %ipx', (viewportWidth) => {
    expect(stageColumnWidth(viewportWidth)).toBeGreaterThan(115)
    expect(34 + stageColumnWidth(viewportWidth) * 7).toBe(viewportWidth)
  })
})

describe('performance state', () => {
  const performance = performances.find((item) => item.id === 'generator-2200-wilkinson')!

  it('uses current before past or future at the start boundary', () => {
    expect(performanceStatus(performance, new Date(performance.start))).toBe('current')
  })

  it('treats an exact end boundary as past', () => {
    expect(performanceStatus(performance, new Date(performance.end))).toBe('past')
  })

  it('keeps later sets future', () => {
    expect(performanceStatus(performance, new Date('2026-07-30T19:00:00.000Z'))).toBe('future')
  })
})

describe('session-only performance marking', () => {
  it('toggles an ID without mutating the prior set', () => {
    const original = new Set(['first'])
    const marked = toggleSetMembership(original, 'second')
    const unmarked = toggleSetMembership(marked, 'second')
    expect(original).toEqual(new Set(['first']))
    expect(marked).toEqual(new Set(['first', 'second']))
    expect(unmarked).toEqual(new Set(['first']))
  })
})
