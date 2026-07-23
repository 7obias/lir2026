import { useRef, useState, type CSSProperties } from 'react'
import { performances, stages, THURSDAY_END, THURSDAY_START } from './data/thursdayTimetable'
import { blockPosition, formatTime, minutesFrom, performanceStatus, PIXELS_PER_MINUTE } from './timetable'
import { formatPragueDateTime, pragueLocalInputToDate, useActiveTime, type TimeMode } from './useActiveTime'
import { useLikedPerformances } from './useLikedPerformances'
import { useTimetableZoom } from './useTimetableZoom'

const totalHeight = minutesFrom(THURSDAY_START, THURSDAY_END) * PIXELS_PER_MINUTE
const performanceIds = new Set(performances.map(({ id }) => id))
const guides = Array.from({ length: 27 }, (_, index) => {
  const timestamp = new Date(new Date(THURSDAY_START).getTime() + index * 30 * 60_000).toISOString()
  return { timestamp, top: index * 30 * PIXELS_PER_MINUTE }
})

export default function App() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const timelineBodyRef = useRef<HTMLDivElement>(null)
  const zoom = useTimetableZoom(timelineBodyRef, scrollerRef)
  const liking = useLikedPerformances(performanceIds, zoom.shouldSuppressClick)
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
    <main className={`app${liking.likeMode ? ' app--like-mode' : ''}`}>
      <header className="compact-header">
        <div className="brand-mark">
          <img className="header-logo" src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" />
          <small
            className="build-id"
            aria-label={`Application build ${__BUILD_NUMBER__}, commit ${__BUILD_REVISION__}`}
          >
            B{__BUILD_NUMBER__} · {__BUILD_REVISION__}
          </small>
        </div>
        <div className="header-title">
          <strong>Let It Roll 2026</strong>
          <span>Thursday 30 July</span>
        </div>
        <button
          className={`like-mode-button${liking.likeMode ? ' like-mode-button--active' : ''}`}
          type="button"
          aria-label={liking.likeMode ? 'Exit Like Mode' : 'Enter Like Mode'}
          aria-pressed={liking.likeMode}
          onClick={liking.toggleLikeMode}
        >
          <span aria-hidden="true">{liking.likeMode ? '♥' : '♡'}</span>
        </button>
        <button className="time-control-button" type="button" aria-label="Open time controls" onClick={openTimeControls}>
          {timeState.mode === 'simulated' && <b>SIM · </b>}
          {formatPragueDateTime(activeTime)}
        </button>
      </header>
      <div className="safe-area-content">
        <div className="timetable-scroll" aria-label="Thursday timetable" ref={scrollerRef}>
          <div
            className="timetable"
            style={{
              '--timetable-width': `${zoom.scale * 100}%`,
              '--timeline-height': `${totalHeight * zoom.scale}px`,
              '--portrait-min-width': `${810 * zoom.scale}px`,
              '--performance-font-size': `${8 * zoom.scale}px`,
              '--performance-time-font-size': `${7 * zoom.scale}px`,
              '--performance-padding': `${2 * zoom.scale}px`,
              '--performance-spacing': `${zoom.scale}px`,
              '--performance-accent-width': `${2 * zoom.scale}px`,
              '--liked-accent-width': `${3 * zoom.scale}px`,
              '--liked-dot-size': `${5 * zoom.scale}px`,
            } as CSSProperties}
          >
          <div className="stage-row">
            <div className="time-heading">TIME</div>
            {stages.map((stage) => (
              <div className={`stage-heading stage-${stage.order}`} key={stage.id}>
                <strong>{stage.name}</strong>
                {stage.subtitle && <small>{stage.subtitle}</small>}
              </div>
            ))}
          </div>
          <div className="timeline-body" ref={timelineBodyRef}>
            <div className="time-column">
              {guides.map((guide, index) => (
                <time
                  className={index % 2 ? 'half-hour' : 'hour'}
                  style={{ top: guide.top * zoom.scale }}
                  key={guide.timestamp}
                >
                  {formatTime(guide.timestamp)}
                </time>
              ))}
            </div>
            {guides.map((guide, index) => (
              <div
                className={index % 2 ? 'guide half-hour' : 'guide hour'}
                style={{ top: guide.top * zoom.scale }}
                key={`guide-${guide.timestamp}`}
              />
            ))}
            {showCursor && (
              <div
                className="current-time-line"
                style={{ top: cursorMinutes * PIXELS_PER_MINUTE * zoom.scale }}
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
                  const status = performanceStatus(performance, activeTime)
                  const statusLabel = status === 'current'
                    ? 'Playing now'
                    : status === 'past' ? 'Past performance' : 'Upcoming performance'
                  const isLiked = liking.likedIds.has(performance.id)
                  return (
                    <button
                      type="button"
                      className={`performance performance--${status}${isLiked ? ' performance--liked' : ''}`}
                      key={performance.id}
                      data-performance-id={performance.id}
                      style={{
                        top: position.top * zoom.scale,
                        height: position.height * zoom.scale,
                      } as CSSProperties}
                      aria-pressed={isLiked}
                      aria-label={`${performance.artist}, ${formatTime(performance.start)} to ${formatTime(performance.end)}, ${stage.name}. ${statusLabel}. ${isLiked ? 'Liked' : 'Not liked'}`}
                      onPointerDown={(event) => liking.onPointerDown(event, performance.id)}
                      onPointerMove={liking.onPointerMove}
                      onPointerUp={liking.onPointerUp}
                      onPointerCancel={liking.onPointerCancel}
                      onKeyDown={(event) => {
                        if (liking.likeMode && (event.key === 'Enter' || event.key === ' ')) {
                          event.preventDefault()
                          liking.toggleLiked(performance.id)
                        }
                      }}
                    >
                      <span className="performance-content">
                        <time>{formatTime(performance.start)}</time>
                        <strong>{performance.artist}</strong>
                        <span className="visually-hidden">{statusLabel}</span>
                      </span>
                    </button>
                  )
                })}
              </section>
            ))}
          </div>
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
