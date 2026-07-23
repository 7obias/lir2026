import { useRef, useState } from 'react'
import { useApp } from '../app/AppContext'
import { DemoNotice } from '../components/StatusUi'
import { PerformanceSheet } from '../components/PerformanceSheet'
import type { Performance, Priority } from '../models'
import { currentlyPlaying, durationMinutes, festivalDate, formatTime, localDateTimeToDate, toDate } from '../utils/schedule'

const PX_PER_MIN = 1.35
export function TimelinePage() {
  const { data } = useApp(); const [dayId, setDayId] = useState(data.festival.days[0]?.id)
  const [selected, setSelected] = useState<Performance>(); const [filters, setFilters] = useState<Set<Priority>>(new Set(['must-see', 'interested', 'unselected', 'skip']))
  const [stageFilter, setStageFilter] = useState('all'); const scroll = useRef<HTMLDivElement>(null)
  const day = data.festival.days.find((d) => d.id === dayId) ?? data.festival.days[0]
  const now = data.settings.previewModeEnabled ? localDateTimeToDate(data.settings.previewDateTime) : new Date()
  const playing = new Set(currentlyPlaying(data.performances, now).map((p) => p.id))
  const selectionMap = new Map(data.selections.map((s) => [s.performanceId, s.priority]))
  const dayPerformances = data.performances.filter((p) => {
    const startDay = festivalDate(toDate(p.start)); const priority = selectionMap.get(p.id) ?? 'unselected'
    return startDay === day?.date && filters.has(priority) && (stageFilter === 'all' || p.stageId === stageFilter)
  })
  if (!day) return null
  const allDay = data.performances.filter((p) => festivalDate(toDate(p.start)) === day.date)
  const origin = Math.min(...allDay.map((p) => toDate(p.start).getTime()))
  const finish = Math.max(...allDay.map((p) => toDate(p.end).getTime()))
  const totalMinutes = Math.max(240, (finish - origin) / 60000)
  const stages = data.festival.stages.filter((s) => stageFilter === 'all' || s.id === stageFilter)
  const toggle = (priority: Priority) => setFilters((current) => { const next = new Set(current); if (next.has(priority)) next.delete(priority); else next.add(priority); return next })
  const jumpNow = () => { const minutes = (now.getTime() - origin) / 60000; scroll.current?.scrollTo({ top: Math.max(0, minutes * PX_PER_MIN - 120), behavior: 'smooth' }) }
  const nowApplicable = festivalDate(now) === day.date && now.getTime() >= origin && now.getTime() <= finish
  return <section className="page timeline-page">
    <header className="page-header"><div><p className="eyebrow">Lake Most · 2026</p><h1>Timeline</h1></div>{nowApplicable && <button className="small-button" onClick={jumpNow}>Jump to now</button>}</header>
    {data.festival.dataSource === 'demo' && <DemoNotice />}
    <div className="day-selector" role="tablist" aria-label="Festival day">{data.festival.days.map((d) => <button role="tab" aria-selected={d.id === day.id} key={d.id} onClick={() => setDayId(d.id)}><strong>{d.label.slice(0, 3)}</strong><span>{new Date(`${d.date}T12:00:00Z`).toLocaleDateString('en', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</span></button>)}</div>
    <div className="filter-row">
      <select aria-label="Filter stage" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}><option value="all">All stages</option>{data.festival.stages.map((s) => <option value={s.id} key={s.id}>{s.name}</option>)}</select>
      {(['must-see', 'interested', 'unselected', 'skip'] as Priority[]).map((p) => <button key={p} className={`filter-chip priority-${p}`} aria-pressed={filters.has(p)} onClick={() => toggle(p)}>{p === 'must-see' ? '★ Must' : p === 'interested' ? '＋ Interested' : p === 'skip' ? '× Skip' : '○ Open'}</button>)}
    </div>
    <div className="timeline-scroller" ref={scroll}>
      <div className="timeline-grid" style={{ '--stage-count': stages.length, '--timeline-height': `${totalMinutes * PX_PER_MIN}px` } as React.CSSProperties}>
        <div className="corner">TIME</div>{stages.map((s) => <div className="stage-header" key={s.id}>{s.name}</div>)}
        <div className="time-axis">{Array.from({ length: Math.ceil(totalMinutes / 30) + 1 }, (_, i) => {
          const date = new Date(origin + i * 30 * 60000); return <div key={i} className={i % 2 ? 'half' : 'hour'} style={{ top: i * 30 * PX_PER_MIN }}><span>{formatTime(date.toISOString())}</span></div>
        })}</div>
        {stages.map((stage, col) => <div key={stage.id} className="stage-column" style={{ gridColumn: col + 2 }}>
          {dayPerformances.filter((p) => p.stageId === stage.id).map((p) => {
            const top = ((toDate(p.start).getTime() - origin) / 60000) * PX_PER_MIN; const priority = selectionMap.get(p.id) ?? 'unselected'
            return <button key={p.id} className={`timetable-block priority-${priority} ${playing.has(p.id) ? 'is-playing' : ''}`} style={{ top, height: Math.max(48, durationMinutes(p) * PX_PER_MIN) }} onClick={() => setSelected(p)} aria-label={`${p.artistName}, ${formatTime(p.start)} to ${formatTime(p.end)}, ${stage.name}, ${priority}`}>
              <strong>{p.artistName}</strong><span>{formatTime(p.start)}–{formatTime(p.end)}</span><small>{priority === 'must-see' ? '★ Must see' : priority === 'interested' ? '＋ Interested' : playing.has(p.id) ? 'Playing now' : ''}</small>
            </button>
          })}
        </div>)}
        {nowApplicable && <div className="now-line" style={{ top: 48 + ((now.getTime() - origin) / 60000) * PX_PER_MIN }}><span>NOW</span></div>}
      </div>
    </div>
    {selected && <PerformanceSheet performance={selected} onClose={() => setSelected(undefined)} />}
  </section>
}
