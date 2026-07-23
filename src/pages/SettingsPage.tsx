import { useRef, useState } from 'react'
import { useApp } from '../app/AppContext'
import { demoData } from '../data/demoTimetable'
import { repository } from '../db/repository'
import { DB_SCHEMA_VERSION, routeKey, type AppData, type Festival, type Theme } from '../models'
import { parseTimetableCsv, type CsvResult } from '../services/csv'
import { ConfirmDialog } from '../components/StatusUi'

const download = (name: string, content: string, type = 'application/json') => {
  const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
}
export function SettingsPage() {
  const { data, updateSettings, reload } = useApp(); const [message, setMessage] = useState(''); const [csv, setCsv] = useState<CsvResult>(); const [confirm, setConfirm] = useState<'csv' | 'reset' | 'demo'>()
  const planInput = useRef<HTMLInputElement>(null); const backupInput = useRef<HTMLInputElement>(null)
  const saveNumber = (key: 'defaultTransferMinutes' | 'defaultReminderMinutes', value: number) => updateSettings({ ...data.settings, [key]: value })
  const importJson = async (file: File | undefined, full: boolean) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as Partial<AppData> & { schemaVersion?: number }
      if ((parsed.schemaVersion ?? parsed.festival?.schemaVersion ?? 1) > DB_SCHEMA_VERSION) throw new Error('unsupported')
      if (full) {
        if (!parsed.festival || !parsed.artists || !parsed.performances || !parsed.selections || !parsed.settings) throw new Error('shape')
        await repository.saveAll(parsed as AppData)
      } else {
        if (!Array.isArray(parsed.selections)) throw new Error('shape')
        for (const selection of parsed.selections) if (data.performances.some((p) => p.id === selection.performanceId)) await repository.saveSelection(selection)
      }
      await reload(); setMessage(full ? 'Complete backup restored.' : 'Personal plan imported.')
    } catch (error) { setMessage(error instanceof Error && error.message === 'unsupported' ? 'This backup uses an unsupported newer schema.' : 'That JSON file is malformed or incompatible.') }
  }
  const applyCsv = async () => {
    if (!csv || csv.errors.length || !csv.performances.length) return
    const festival: Festival = { ...data.festival, days: csv.days, stages: csv.stages, dataSource: 'imported', importedAt: new Date().toISOString() }
    const preserved = await repository.replaceTimetable(festival, csv.artists, csv.performances); await reload(); setCsv(undefined); setConfirm(undefined); setMessage(`Timetable imported. ${preserved} selection${preserved === 1 ? '' : 's'} preserved.`)
  }
  return <section className="page settings-page"><header className="page-header"><div><p className="eyebrow">Local & private</p><h1>Settings</h1></div></header>
    {message && <div className="toast-inline" role="status">{message}</div>}
    <section className="settings-group"><h2>Festival mode</h2><label className="setting-row"><span><strong>Preview mode</strong><small>Test Now outside festival dates</small></span><input type="checkbox" checked={data.settings.previewModeEnabled} onChange={(e) => updateSettings({ ...data.settings, previewModeEnabled: e.target.checked })} /></label>
      <label>Simulated Europe/Prague time<input type="datetime-local" value={data.settings.previewDateTime} onChange={(e) => updateSettings({ ...data.settings, previewDateTime: e.target.value })} /></label>
      <label>Theme<select value={data.settings.theme} onChange={(e) => updateSettings({ ...data.settings, theme: e.target.value as Theme })}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
    </section>
    <section className="settings-group"><h2>Timing</h2><label>Default transfer time <span className="input-suffix"><input type="number" min="0" max="90" value={data.settings.defaultTransferMinutes} onChange={(e) => saveNumber('defaultTransferMinutes', Number(e.target.value))} /> min</span></label>
      <label>Default reminder <span className="input-suffix"><input type="number" min="0" max="120" value={data.settings.defaultReminderMinutes} onChange={(e) => saveNumber('defaultReminderMinutes', Number(e.target.value))} /> min</span></label>
      <h3>Directional stage transfers</h3>{data.festival.stages.flatMap((from) => data.festival.stages.filter((to) => to.id !== from.id).map((to) => <label className="route-row" key={routeKey(from.id, to.id)}><span>{from.name} <b>→</b> {to.name}</span><input aria-label={`${from.name} to ${to.name} minutes`} type="number" min="0" max="90" placeholder={String(data.settings.defaultTransferMinutes)} value={data.settings.stageTransferTimes[routeKey(from.id, to.id)] ?? ''} onChange={(e) => { const routes = { ...data.settings.stageTransferTimes }; if (e.target.value === '') delete routes[routeKey(from.id, to.id)]; else routes[routeKey(from.id, to.id)] = Number(e.target.value); void updateSettings({ ...data.settings, stageTransferTimes: routes }) }} /></label>))}
    </section>
    <section className="settings-group"><h2>Timetable import</h2><p>CSV stays on this device. Required columns: day, stage, artist, start, end, genres.</p><label className="file-button">Choose timetable CSV<input type="file" accept=".csv,text/csv" onChange={async (e) => { const file = e.target.files?.[0]; if (file) setCsv(parseTimetableCsv(await file.text())) }} /></label><button onClick={() => download('lir-timetable-example.csv', 'day,stage,artist,start,end,genres\n2026-07-30,Mothership,Aphrodite,22:00,23:00,jungle\n2026-07-30,Temple,Current Value,22:30,23:30,neurofunk\n', 'text/csv')}>Download example CSV</button>
      {csv && <div className="import-preview"><h3>Import preview</h3><div className="import-stats"><span><b>{csv.days.length}</b> days</span><span><b>{csv.stages.length}</b> stages</span><span><b>{csv.artists.length}</b> artists</span><span><b>{csv.performances.length}</b> sets</span><span><b>{csv.errors.length}</b> invalid</span></div>{csv.errors.length > 0 && <ul className="errors">{csv.errors.map((e) => <li key={`${e.row}-${e.message}`}>Row {e.row}: {e.message}</li>)}</ul>}<button className="primary" disabled={!!csv.errors.length || !csv.performances.length} onClick={() => setConfirm('csv')}>Replace timetable</button></div>}
    </section>
    <section className="settings-group"><h2>Backup & restore</h2><div className="button-grid"><button onClick={() => download('lir-personal-plan.json', JSON.stringify({ schemaVersion: DB_SCHEMA_VERSION, selections: data.selections }, null, 2))}>Export personal plan</button><button onClick={() => planInput.current?.click()}>Import personal plan</button><button onClick={() => download('lir-complete-backup.json', JSON.stringify({ ...data, schemaVersion: DB_SCHEMA_VERSION }, null, 2))}>Export all local data</button><button onClick={() => backupInput.current?.click()}>Import all local data</button></div><input hidden ref={planInput} type="file" accept=".json,application/json" onChange={(e) => importJson(e.target.files?.[0], false)} /><input hidden ref={backupInput} type="file" accept=".json,application/json" onChange={(e) => importJson(e.target.files?.[0], true)} />
    </section>
    <section className="settings-group danger-zone"><h2>Reset</h2><button onClick={() => setConfirm('reset')}>Reset personal selections</button><button onClick={() => setConfirm('demo')}>Reset timetable to demo data</button></section>
    <section className="settings-group"><h2>App status</h2><dl className="status-list"><div><dt>Version</dt><dd>1.0.0</dd></div><div><dt>Database schema</dt><dd>{DB_SCHEMA_VERSION}</dd></div><div><dt>Connection</dt><dd>{navigator.onLine ? 'Online' : 'Offline'}</dd></div><div><dt>Display</dt><dd>{matchMedia('(display-mode: standalone)').matches ? 'Standalone PWA' : 'Browser tab'}</dd></div><div><dt>Service worker</dt><dd>{'serviceWorker' in navigator ? 'Supported' : 'Unavailable'}</dd></div></dl><p className="iphone-note"><strong>Install on iPhone</strong><br />Open this page in Safari, tap Share, then Add to Home Screen.</p></section>
    {confirm === 'csv' && <ConfirmDialog title="Replace timetable?" confirmLabel="Replace timetable" onClose={() => setConfirm(undefined)} onConfirm={applyCsv}>The current timetable will be replaced. Matching personal selections will be preserved.</ConfirmDialog>}
    {confirm === 'reset' && <ConfirmDialog title="Reset personal selections?" confirmLabel="Reset selections" onClose={() => setConfirm(undefined)} onConfirm={async () => { await repository.resetSelections(); await reload(); setConfirm(undefined); setMessage('Personal selections reset.') }}>This removes priorities, reminders, and notes. It cannot be undone.</ConfirmDialog>}
    {confirm === 'demo' && <ConfirmDialog title="Restore demo timetable?" confirmLabel="Restore demo" onClose={() => setConfirm(undefined)} onConfirm={async () => { await repository.resetDemo(); await reload(); setConfirm(undefined); setMessage(`${demoData.performances.length} demo performances restored.`) }}>Imported timetable data will be replaced. Matching selections remain.</ConfirmDialog>}
  </section>
}
