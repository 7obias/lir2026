import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { demoData } from '../data/demoTimetable'
import type { AppData, Artist, Festival, FestivalDay, ImportMetadata, Performance, Stage, UserSelection, UserSettings } from '../models'
import { DB_SCHEMA_VERSION } from '../models'

interface PlannerDB extends DBSchema {
  festival: { key: string; value: Festival }
  days: { key: string; value: FestivalDay }
  stages: { key: string; value: Stage }
  artists: { key: string; value: Artist }
  performances: { key: string; value: Performance }
  selections: { key: string; value: UserSelection }
  settings: { key: string; value: UserSettings }
  imports: { key: string; value: ImportMetadata }
}
let dbPromise: Promise<IDBPDatabase<PlannerDB>> | undefined
const db = () => {
  dbPromise ??= openDB<PlannerDB>('lir-2026-planner', DB_SCHEMA_VERSION, {
    upgrade(database) {
      for (const name of ['festival', 'days', 'stages', 'artists', 'performances', 'selections', 'settings', 'imports'] as const)
        if (!database.objectStoreNames.contains(name)) database.createObjectStore(name)
    }
  })
  return dbPromise
}
type ReplaceableStore = 'days' | 'stages' | 'artists' | 'performances' | 'selections'
const replaceStore = async (database: IDBPDatabase<PlannerDB>, name: ReplaceableStore, entries: [string, FestivalDay | Stage | Artist | Performance | UserSelection][]) => {
  const tx = database.transaction(name, 'readwrite'); await tx.store.clear()
  for (const [key, value] of entries) await tx.store.put(value as never, key)
  await tx.done
}
export const repository = {
  async initialize(): Promise<AppData> {
    const database = await db()
    if (!(await database.get('festival', 'current'))) await this.saveAll(demoData)
    return this.load()
  },
  async load(): Promise<AppData> {
    const database = await db(); const festival = await database.get('festival', 'current')
    if (!festival) throw new Error('Planner storage has not been initialized.')
    return {
      festival: { ...festival, days: await database.getAll('days'), stages: await database.getAll('stages') },
      artists: await database.getAll('artists'), performances: await database.getAll('performances'),
      selections: await database.getAll('selections'), settings: (await database.get('settings', 'current')) ?? demoData.settings
    }
  },
  async saveAll(data: AppData) {
    const database = await db()
    await database.put('festival', { ...data.festival, days: [], stages: [] }, 'current')
    await replaceStore(database, 'days', data.festival.days.map((v) => [v.id, v]))
    await replaceStore(database, 'stages', data.festival.stages.map((v) => [v.id, v]))
    await replaceStore(database, 'artists', data.artists.map((v) => [v.id, v]))
    await replaceStore(database, 'performances', data.performances.map((v) => [v.id, v]))
    await replaceStore(database, 'selections', data.selections.map((v) => [v.performanceId, v]))
    await database.put('settings', data.settings, 'current')
  },
  async saveSelection(selection: UserSelection) { await (await db()).put('selections', selection, selection.performanceId) },
  async deleteSelection(id: string) { await (await db()).delete('selections', id) },
  async saveSettings(settings: UserSettings) { await (await db()).put('settings', settings, 'current') },
  async replaceTimetable(festival: Festival, artists: Artist[], performances: Performance[]) {
    const current = await this.load(); const valid = new Set(performances.map((p) => p.id))
    const selections = current.selections.filter((s) => valid.has(s.performanceId))
    await this.saveAll({ festival, artists, performances, selections, settings: current.settings })
    return selections.length
  },
  async resetSelections() { await (await db()).clear('selections') },
  async resetDemo() { const current = await this.load(); await this.saveAll({ ...demoData, settings: current.settings, selections: current.selections.filter((s) => demoData.performances.some((p) => p.id === s.performanceId)) }) }
}
