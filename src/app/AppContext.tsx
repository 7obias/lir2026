import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { demoData } from '../data/demoTimetable'
import { repository } from '../db/repository'
import type { AppData, Priority, UserSelection, UserSettings } from '../models'

interface AppState {
  data: AppData; loading: boolean; error?: string
  setPriority: (id: string, priority: Priority, extra?: Partial<UserSelection>) => Promise<void>
  updateSettings: (settings: UserSettings) => Promise<void>; reload: () => Promise<void>
}
const Context = createContext<AppState | undefined>(undefined)
export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(demoData); const [loading, setLoading] = useState(true); const [error, setError] = useState<string>()
  const reload = async () => { try { setData(await repository.load()) } catch { setError('Local storage could not be read. Changes may not persist.') } }
  useEffect(() => { repository.initialize().then(setData).catch(() => setError('IndexedDB is unavailable. The planner is running with temporary demo data.')).finally(() => setLoading(false)) }, [])
  useEffect(() => {
    const root = document.documentElement; root.dataset.theme = data.settings.theme
    root.style.colorScheme = data.settings.theme === 'system' ? 'light dark' : data.settings.theme
  }, [data.settings.theme])
  const value = useMemo<AppState>(() => ({
    data, loading, error, reload,
    setPriority: async (id, priority, extra = {}) => {
      const existing = data.selections.find((s) => s.performanceId === id)
      if (priority === 'unselected') {
        try { await repository.deleteSelection(id); setData((d) => ({ ...d, selections: d.selections.filter((s) => s.performanceId !== id) })) } catch { setError('That selection could not be saved.') }
        return
      }
      const selection: UserSelection = { performanceId: id, priority, reminderMinutes: existing?.reminderMinutes ?? data.settings.defaultReminderMinutes, notes: existing?.notes ?? '', updatedAt: new Date().toISOString(), ...extra }
      try { await repository.saveSelection(selection); setData((d) => ({ ...d, selections: [...d.selections.filter((s) => s.performanceId !== id), selection] })) } catch { setError('That selection could not be saved.') }
    },
    updateSettings: async (settings) => { try { await repository.saveSettings(settings); setData((d) => ({ ...d, settings })) } catch { setError('Settings could not be saved.') } }
  }), [data, loading, error])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
// Shared hook intentionally lives beside its provider.
// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => { const value = useContext(Context); if (!value) throw new Error('useApp must be inside AppProvider'); return value }
