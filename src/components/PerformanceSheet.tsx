import { useEffect, useRef, useState } from 'react'
import type { Performance, Priority } from '../models'
import { durationMinutes, formatTime } from '../utils/schedule'
import { useApp } from '../app/AppContext'
import { PrioritySelector } from './PrioritySelector'
export function PerformanceSheet({ performance, onClose }: { performance: Performance; onClose: () => void }) {
  const { data, setPriority } = useApp(); const dialog = useRef<HTMLDialogElement>(null)
  const selection = data.selections.find((s) => s.performanceId === performance.id)
  const [notes, setNotes] = useState(selection?.notes ?? ''); const [reminder, setReminder] = useState(selection?.reminderMinutes ?? data.settings.defaultReminderMinutes)
  useEffect(() => { const el = dialog.current; el?.showModal(); return () => el?.close() }, [])
  const stage = data.festival.stages.find((s) => s.id === performance.stageId)?.name ?? performance.stageId
  const day = data.festival.days.find((d) => performance.start.startsWith(d.date))?.label ?? 'Festival night'
  const save = async (priority: Priority) => { await setPriority(performance.id, priority, { notes, reminderMinutes: reminder }) }
  return <dialog ref={dialog} className="sheet" onCancel={onClose} onClick={(e) => { if (e.target === dialog.current) onClose() }}>
    <div className="sheet-handle" /><button className="icon-button close" aria-label="Close details" onClick={onClose}>×</button>
    <p className="eyebrow">{day} · {stage}</p><h2>{performance.artistName}</h2>
    <p className="set-time">{formatTime(performance.start)}–{formatTime(performance.end)} · {durationMinutes(performance)} min</p>
    <div className="tags">{performance.genres.map((genre) => <span key={genre}>{genre}</span>)}</div>
    {performance.description && <p>{performance.description}</p>}
    <PrioritySelector value={selection?.priority ?? 'unselected'} onChange={save} />
    <label>Reminder lead time <span className="input-suffix"><input type="number" min="0" max="120" value={reminder} onChange={(e) => setReminder(Number(e.target.value))} /> min</span></label>
    <label>Personal notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Meet at the left speaker…" /></label>
    <button className="primary wide" onClick={() => save(selection?.priority ?? 'interested')}>Save details</button>
  </dialog>
}
