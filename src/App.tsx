import { useRef, useState, type CSSProperties } from 'react'
import { performances, stages, THURSDAY_END, THURSDAY_START } from './data/thursdayTimetable'
import { blockPosition, formatTime, minutesFrom, PIXELS_PER_MINUTE } from './timetable'
import { formatPragueDateTime, pragueLocalInputToDate, useActiveTime, type TimeMode } from './useActiveTime'

const totalHeight = minutesFrom(THURSDAY_START, THURSDAY_END) * PIXELS_PER_MINUTE
const guides = Array.from({ length: 27 }, (_, index) => {
  const timestamp = new Date(new Date(THURSDAY_START).getTime() + index * 30 * 60_000).toISOString()
  return { timestamp, top: index * 30 * PIXELS_PER_MINUTE }
})

export default function App() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { activeTime, timeState, setTimeState, activateLive } = useActiveTime()
  const [draftMode, setDraftMode] = useState<TimeMode>(timeState.mode)
  const [draftDateTime, setDraftDateTime] = useState(timeState.simulatedDateTime ?? '2026-07-30T22:00')
  const cursorMinutes = minutesFrom(THURSDAY_START, activeTime.toISOString())
  const showCursor = activeTime >= new Date(THURSDAY_START) && activeTime <= new Date(THURSDAY_END)
  const simulatedInputIsValid = !Number.isNaN(pragueLocalInputToDate(draftDateTime).getTime())
  const openTimeControls = () => {
    setDraftMode(timeState.mode)
    setDraftDateTime(timeState.simulatedDateTime ?? '2026-07-30T22:00')
    dialogRef.current?.showModal()
  }
  const applyTime = () => {
    if (draftMode === 'live') activateLive()
    else if (simulatedInputIsValid) setTimeState({ mode: 'simulated', simulatedDateTime: draftDateTime })
    dialogRef.current?.close()
  }
  const useCurrentTime = () => {
    activateLive()
    dialogRef.current?.close()
  }

  return (
    <main className="app">
      <header className="compact-header">
        <img className="header-logo" src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" />
        <div className="header-title">
          <strong>Let It Roll 2026</strong>
          <span>Thursday 30 July</span>
        </div>
        <button className="time-control-button" type="button" aria-label="Open time controls" onClick={openTimeControls}>
          {timeState.mode === 'simulated' && <b>SIM · </b>}
          {formatPragueDateTime(activeTime)}
        </button>
      </header>
      <div className="timetable-scroll" aria-label="Thursday timetable">
        <div className="timetable" style={{ '--timeline-height': `${totalHeight}px` } as CSSProperties}>
          <div className="stage-row">
            <div className="time-heading">TIME</div>
            {stages.map((stage) => (
              <div className={`stage-heading stage-${stage.order}`} key={stage.id}>
                <strong>{stage.name}</strong>
                {stage.subtitle && <small>{stage.subtitle}</small>}
              </div>
            ))}
          </div>
          <div className="timeline-body">
            <div className="time-column">
              {guides.map((guide, index) => (
                <time className={index % 2 ? 'half-hour' : 'hour'} style={{ top: guide.top }} key={guide.timestamp}>
                  {formatTime(guide.timestamp)}
                </time>
              ))}
            </div>
            {guides.map((guide, index) => (
              <div className={index % 2 ? 'guide half-hour' : 'guide hour'} style={{ top: guide.top }} key={`guide-${guide.timestamp}`} />
            ))}
            {showCursor && (
              <div
                className="current-time-line"
                style={{ '--current-time-top': `${cursorMinutes * PIXELS_PER_MINUTE}px` } as CSSProperties}
                aria-label={`Current timetable time: ${formatTime(activeTime.toISOString())}`}
                role="status"
              >
                <span className="current-time-label">{formatTime(activeTime.toISOString())}</span>
              </div>
            )}
            {stages.map((stage) => (
              <section className={`stage-lane stage-${stage.order}`} aria-label={stage.name} key={stage.id}>
                {performances.filter((performance) => performance.stageId === stage.id).map((performance) => {
                  const position = blockPosition(performance, THURSDAY_START)
                  return (
                    <article
                      className="performance"
                      key={performance.id}
                      style={{ top: position.top, height: position.height }}
                      aria-label={`${performance.artist}, ${formatTime(performance.start)} to ${formatTime(performance.end)}, ${stage.name}`}
                    >
                      <time>{formatTime(performance.start)}</time>
                      <strong>{performance.artist}</strong>
                    </article>
                  )
                })}
              </section>
            ))}
          </div>
        </div>
      </div>
      <footer>Timetable data sourced from the official Let It Roll 2026 timetable. Schedule may change.</footer>
      <dialog className="time-dialog" ref={dialogRef}>
        <form method="dialog" onSubmit={(event) => event.preventDefault()}>
          <div className="dialog-heading">
            <h2>Timetable time</h2>
            <button className="dialog-close" type="button" aria-label="Close time controls" onClick={() => dialogRef.current?.close()}>×</button>
          </div>
          <fieldset>
            <legend>Mode</legend>
            <label><input type="radio" name="time-mode" checked={draftMode === 'live'} onChange={() => setDraftMode('live')} /> Current time</label>
            <label><input type="radio" name="time-mode" checked={draftMode === 'simulated'} onChange={() => setDraftMode('simulated')} /> Simulated time</label>
          </fieldset>
          <label className="datetime-field">
            Simulated date and time
            <input
              type="datetime-local"
              value={draftDateTime}
              disabled={draftMode !== 'simulated'}
              onChange={(event) => setDraftDateTime(event.target.value)}
            />
          </label>
          <div className="dialog-actions">
            <button type="button" onClick={() => dialogRef.current?.close()}>Cancel</button>
            <button type="button" onClick={useCurrentTime}>Use current time</button>
            <button className="apply-button" type="button" disabled={draftMode === 'simulated' && !simulatedInputIsValid} onClick={applyTime}>Apply</button>
          </div>
        </form>
      </dialog>
    </main>
  )
}
