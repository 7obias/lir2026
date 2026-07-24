import { useCallback, useState } from 'react'
import type { FestivalDay } from './data/festivalTimetable'

export const SELECTED_DAY_STORAGE_KEY = 'lir2026.selected-timetable-day.v1'

export const initialSelectedDay = (
  days: readonly FestivalDay[],
  storage: Pick<Storage, 'getItem'>,
) => {
  const stored = storage.getItem(SELECTED_DAY_STORAGE_KEY)
  return days.some(({ id }) => id === stored) ? stored! : days[0]?.id ?? ''
}

export function useSelectedDay(days: readonly FestivalDay[]) {
  const [selectedDayId, setSelectedDayState] = useState(() => {
    try {
      return initialSelectedDay(days, localStorage)
    } catch {
      return days[0]?.id ?? ''
    }
  })

  const setSelectedDayId = useCallback((dayId: string) => {
    if (!days.some(({ id }) => id === dayId)) return
    setSelectedDayState(dayId)
    try {
      localStorage.setItem(SELECTED_DAY_STORAGE_KEY, dayId)
    } catch {
      // Day switching remains available when local storage is unavailable.
    }
  }, [days])

  return {
    selectedDayId,
    setSelectedDayId,
  }
}
