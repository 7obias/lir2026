import { describe, expect, it } from 'vitest'
import { festivalDays } from './data/festivalTimetable'
import { initialSelectedDay, SELECTED_DAY_STORAGE_KEY } from './useSelectedDay'

const storageWith = (value: string | null): Pick<Storage, 'getItem'> => ({
  getItem: (key) => key === SELECTED_DAY_STORAGE_KEY ? value : null,
})

describe('selected festival day persistence', () => {
  it('restores a stored stable day ID', () => {
    expect(initialSelectedDay(festivalDays, storageWith('2026-08-01'))).toBe('2026-08-01')
  })

  it('uses the first available day when storage is empty or stale', () => {
    expect(initialSelectedDay(festivalDays, storageWith(null))).toBe('2026-07-30')
    expect(initialSelectedDay(festivalDays, storageWith('Sunday'))).toBe('2026-07-30')
  })
})
