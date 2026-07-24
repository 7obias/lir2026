import { describe, expect, it } from 'vitest'
import { matchingPerformanceIds, normalizeTimetableSearch } from './timetableSearch'

const stages = [
  { id: 'generator', name: 'Generator' },
  { id: 'bass-shelter', name: 'Bass Shelter' },
]

const performances = [
  { id: 'lenzman', artist: 'Lenzman', stageId: 'generator' },
  { id: 'crew', artist: 'North Base', displayTitle: 'Crew showcase', stageId: 'generator' },
  { id: 'annix', artist: 'Annix', stageId: 'bass-shelter' },
]

describe('timetable search', () => {
  it('normalizes whitespace and case', () => {
    expect(normalizeTimetableSearch('  LeNz  ')).toBe('lenz')
    expect(normalizeTimetableSearch('   ')).toBe('')
  })

  it('partially matches artist names, display titles, and stage names', () => {
    expect([...matchingPerformanceIds(performances, stages, 'lenz')]).toEqual(['lenzman'])
    expect([...matchingPerformanceIds(performances, stages, 'crew')]).toEqual(['crew'])
    expect([...matchingPerformanceIds(performances, stages, 'bass')]).toEqual(['annix'])
  })

  it('returns no filtering matches for a blank query', () => {
    expect(matchingPerformanceIds(performances, stages, '  ').size).toBe(0)
  })
})
