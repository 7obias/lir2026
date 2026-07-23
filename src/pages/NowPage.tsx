import { differenceInMinutes } from 'date-fns'
import { useApp } from '../app/AppContext'
import { DemoNotice } from '../components/StatusUi'
import { currentlyPlaying, festivalDate, formatFestivalDateTime, formatTime, localDateTimeToDate, nextSelected, recommendedDeparture, sortChronologically, toDate, transferMinutes } from '../utils/schedule'
export function NowPage() {
  const { data } = useApp(); const now = data.settings.previewModeEnabled ? localDateTimeToDate(data.settings.previewDateTime) : new Date()
  const active = currentlyPlaying(data.performances, now); const selectedIds = new Set(data.selections.filter((s) => ['must-see', 'interested'].includes(s.priority)).map((s) => s.performanceId))
  const currentSelected = active.find((p) => selectedIds.has(p.id)); const next = nextSelected(data.performances, data.selections, now)
  const later = sortChronologically(data.performances.filter((p) => selectedIds.has(p.id) && next && toDate(p.start) > toDate(next.start))).slice(0, 2)
  const firstStart = Math.min(...data.performances.map((p) => toDate(p.start).getTime())); const lastEnd = Math.max(...data.performances.map((p) => toDate(p.end).getTime()))
  const currentDay = data.festival.days.find((d) => d.date === festivalDate(now))
  const fromStage = currentSelected?.stageId ?? next?.stageId; const transfer = next && fromStage ? transferMinutes(fromStage, next.stageId, data.settings) : 0
  const leave = next ? recommendedDeparture(next, transfer) : undefined
  const stageName = (id: string) => data.festival.stages.find((s) => s.id === id)?.name ?? id
  const state = !Number.isFinite(firstStart) ? 'No timetable is loaded.' : now.getTime() < firstStart ? 'The festival has not started.' : now.getTime() > lastEnd ? 'The festival has finished.' : !currentDay && !active.length ? 'Between festival days.' : !currentSelected ? 'No selected performance is currently playing.' : ''
  return <section className="page now-page"><header className="now-header"><p className="eyebrow">{data.settings.previewModeEnabled ? 'PREVIEW TIME · EUROPE/PRAGUE' : 'LIVE · EUROPE/PRAGUE'}</p><time>{formatFestivalDateTime(now)}</time><h1>{currentDay?.label ?? 'LIR 2026'}</h1></header>
    {data.festival.dataSource === 'demo' && <DemoNotice />}
    {state && <div className="state-message">{state}</div>}
    <article className="now-card current"><p className="eyebrow">On your plan now</p>{currentSelected ? <><h2>{currentSelected.artistName}</h2><p>{stageName(currentSelected.stageId)} · until {formatTime(currentSelected.end)}</p></> : <h2>Nothing selected is playing</h2>}</article>
    <article className="now-card next"><p className="eyebrow">Next up</p>{next ? <><div className="countdown">{Math.max(0, differenceInMinutes(toDate(next.start), now))}<small>min</small></div><h2>{next.artistName}</h2><p>{formatTime(next.start)} · {stageName(next.stageId)}</p><div className="departure"><div><span>Leave at</span><strong>{leave && formatTime(leave.toISOString())}</strong></div><div><span>Departure in</span><strong>{leave ? Math.max(0, differenceInMinutes(leave, now)) : 0} min</strong></div><div><span>Transfer</span><strong>{transfer} min</strong></div></div></> : <><h2>No more selected sets</h2><p>{currentDay ? 'Nothing else is selected today.' : 'Build your route in My Plan.'}</p></>}</article>
    <section><h2 className="section-title">Playing now</h2><div className="playing-list">{active.filter((p) => p.id !== currentSelected?.id).map((p) => <div key={p.id}><strong>{p.artistName}</strong><span>{stageName(p.stageId)} · until {formatTime(p.end)}</span></div>)}{!active.length && <p>No performances at this time.</p>}</div></section>
    {!!later.length && <section><h2 className="section-title">Then</h2>{later.map((p) => <div className="later-row" key={p.id}><time>{formatTime(p.start)}</time><strong>{p.artistName}</strong><span>{stageName(p.stageId)}</span></div>)}</section>}
  </section>
}
