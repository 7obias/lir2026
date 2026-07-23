import { describe, expect, it } from 'vitest'
import { advanceTapSequence, readMarkedPerformanceIds, type TapSequence } from './useMarkedPerformances'

const tap = (time: number, performanceId = 'set-1', x = 20, y = 30) => ({
  performanceId,
  time,
  x,
  y,
})

describe('triple-tap marking', () => {
  it('triggers immediately on the third nearby tap', () => {
    let sequence: TapSequence | undefined
    for (const time of [100, 250]) {
      const result = advanceTapSequence(sequence, tap(time))
      expect(result.triggered).toBe(false)
      sequence = result.next
    }

    const third = advanceTapSequence(sequence, tap(400))
    expect(third.triggered).toBe(true)
    expect(third.next).toBeUndefined()
  })

  it('resets for another set, a late tap, or a distant tap', () => {
    const first = advanceTapSequence(undefined, tap(100)).next
    expect(advanceTapSequence(first, tap(200, 'set-2')).next?.count).toBe(1)
    expect(advanceTapSequence(first, tap(900)).next?.count).toBe(1)
    expect(advanceTapSequence(first, tap(200, 'set-1', 100)).next?.count).toBe(1)
  })
})

describe('marked performance persistence', () => {
  it('loads only known stable performance IDs', () => {
    const storage = { getItem: () => JSON.stringify(['set-1', 'removed-set', 4]) }
    expect([...readMarkedPerformanceIds(storage, new Set(['set-1', 'set-2']))]).toEqual(['set-1'])
  })

  it('handles unavailable or malformed storage safely', () => {
    expect(readMarkedPerformanceIds(undefined, new Set(['set-1']))).toEqual(new Set())
    expect(readMarkedPerformanceIds({ getItem: () => '{' }, new Set(['set-1']))).toEqual(new Set())
  })
})
