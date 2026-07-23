import { useState } from 'react'
import { useApp } from '../app/AppContext'
import { EmptyState } from '../components/StatusUi'
import { PrioritySelector } from '../components/PrioritySelector'
import type { Performance } from '../models'
import { durationMinutes, formatTime, minutesBetween, overlapMinutes, sortChronologically, splitSet, transferFeasible, transferMinutes } from '../utils/schedule'
function Conflict({ first, second }: { first: Performance; second: Performance }) {
  const { data } = useApp(); const overlap = overlapMinutes(first, second); const transfer = transferMinutes(first.stageId, second.stageId, data.settings); const gap = minutesBetween(first, second)
  if (!overlap && transferFeasible(first, second, data.settings)) return null
  const split = splitSet(first, second, transfer)
  return <aside className="conflict" role="status"><strong>{overlap ? `Clash · ${overlap} min overlap` : 'Transfer warning'}</strong>
    <p>{overlap ? `${first.artistName} and ${second.artistName} overlap by ${overlap} minutes.` : `Only ${gap} minutes available; ${transfer} required.`}</p>
    <details><summary>Planning options</summary><ul><li>Stay for the full first set</li><li>Leave the first set early</li><li>Arrive at the second set late</li><li>Keep both selected</li><li>Split: leave {formatTime(split.departure.toISOString())}, arrive {formatTime(split.arrival.toISOString())}; attend about {split.firstMinutes} + {split.secondMinutes} min, including {transfer} min transfer.</li></ul></details>
  </aside>
}
export function PlanPage() {
  const { data, setPriority } = useApp(); const [mustOnly, setMustOnly] = useState(false)
  const ids = new Set(data.selections.filter((s) => s.priority === 'must-see' || (!mustOnly && s.priority === 'interested')).map((s) => s.performanceId))
  const selected = sortChronologically(data.performances.filter((p) => ids.has(p.id)))
  return <section className="page"><header className="page-header"><div><p className="eyebrow">Your route</p><h1>My Plan</h1></div><label className="switch"><input type="checkbox" checked={mustOnly} onChange={(e) => setMustOnly(e.target.checked)} /><span />Must-see only</label></header>
    {!selected.length ? <EmptyState title="Your plan is wide open">Choose Must see or Interested on the Timeline or Artists screen.</EmptyState> :
      data.festival.days.map((day) => { const items = selected.filter((p) => p.start.startsWith(day.date)); if (!items.length) return null; return <section className="plan-day" key={day.id}><h2>{day.label}<span>{day.date}</span></h2>{items.map((p, i) => { const selection = data.selections.find((s) => s.performanceId === p.id)!; const stage = data.festival.stages.find((s) => s.id === p.stageId)?.name; return <div key={p.id}>{i > 0 && <Conflict first={items[i - 1]} second={p} />}<article className={`plan-card priority-${selection.priority}`}><div className="plan-time"><strong>{formatTime(p.start)}</strong><span>{formatTime(p.end)}</span></div><div><p className="eyebrow">{stage} · {durationMinutes(p)} min</p><h3>{p.artistName}</h3><PrioritySelector compact value={selection.priority} onChange={(next) => setPriority(p.id, next)} /></div></article></div>})}</section> })}
  </section>
}
