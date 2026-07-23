import { describe, expect, it } from 'vitest'
import { isDeliberateTap, readLikedPerformanceIds } from './useLikedPerformances'

describe('Like Mode tap recognition', () => {
  it('accepts a short stationary tap', () => {
    expect(isDeliberateTap(20, 30, 24, 34)).toBe(true)
  })

  it('rejects movement that indicates scrolling', () => {
    expect(isDeliberateTap(20, 30, 20, 42)).toBe(false)
  })
})

describe('liked performance persistence', () => {
  it('loads only known stable performance IDs', () => {
    const storage = {
      getItem: (key: string) => key === 'lir2026:liked-performance-ids'
        ? JSON.stringify(['set-1', 'removed-set', 4])
        : null,
    }
    expect([...readLikedPerformanceIds(storage, new Set(['set-1', 'set-2']))]).toEqual(['set-1'])
  })

  it('migrates the previous marked-ID storage key', () => {
    const storage = {
      getItem: (key: string) => key === 'lir2026:marked-performance-ids'
        ? JSON.stringify(['set-2'])
        : null,
    }
    expect([...readLikedPerformanceIds(storage, new Set(['set-1', 'set-2']))]).toEqual(['set-2'])
  })

  it('handles unavailable or malformed storage safely', () => {
    expect(readLikedPerformanceIds(undefined, new Set(['set-1']))).toEqual(new Set())
    expect(readLikedPerformanceIds({ getItem: () => '{' }, new Set(['set-1']))).toEqual(new Set())
  })
})
