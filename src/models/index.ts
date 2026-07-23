export const DB_SCHEMA_VERSION = 1
export const FESTIVAL_TIMEZONE = 'Europe/Prague'

export type Priority = 'must-see' | 'interested' | 'skip' | 'unselected'
export type Theme = 'system' | 'light' | 'dark'

export interface FestivalDay { id: string; date: string; label: string; sortOrder: number }
export interface Stage { id: string; name: string; sortOrder: number }
export interface Artist { id: string; name: string; genres: string[]; description?: string }
export interface Performance {
  id: string; artistId: string; artistName: string; stageId: string
  start: string; end: string; genres: string[]; description?: string
}
export interface Festival {
  id: string; name: string; venue: string; timezone: string; days: FestivalDay[]
  stages: Stage[]; dataSource: 'demo' | 'imported'; importedAt: string; schemaVersion: number
}
export interface UserSelection {
  performanceId: string; priority: Priority; reminderMinutes: number; notes: string; updatedAt: string
}
export interface UserSettings {
  theme: Theme; defaultTransferMinutes: number; defaultReminderMinutes: number
  stageTransferTimes: Record<string, number>; previewModeEnabled: boolean; previewDateTime: string
}
export interface AppData {
  festival: Festival; artists: Artist[]; performances: Performance[]
  selections: UserSelection[]; settings: UserSettings
}
export interface ImportMetadata { id: string; importedAt: string; source: string; performanceCount: number }

export const defaultSettings: UserSettings = {
  theme: 'system', defaultTransferMinutes: 10, defaultReminderMinutes: 15,
  stageTransferTimes: {}, previewModeEnabled: false, previewDateTime: '2026-07-30T22:15'
}

export const priorityLabels: Record<Priority, string> = {
  'must-see': 'Must see', interested: 'Interested', unselected: 'Unselected', skip: 'Skip'
}

export const routeKey = (from: string, to: string) => `${from}→${to}`
