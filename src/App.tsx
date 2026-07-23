import { performances, stages, THURSDAY_END, THURSDAY_START } from './data/thursdayTimetable'
import { blockPosition, formatTime, minutesFrom, PIXELS_PER_MINUTE } from './timetable'

const totalHeight = minutesFrom(THURSDAY_START, THURSDAY_END) * PIXELS_PER_MINUTE
const guides = Array.from({ length: 27 }, (_, index) => {
  const timestamp = new Date(new Date(THURSDAY_START).getTime() + index * 30 * 60_000).toISOString()
  return { timestamp, top: index * 30 * PIXELS_PER_MINUTE }
})

export default function App() {
  return (
    <main className="app">
      <header className="compact-header">
        <strong>Let It Roll 2026</strong>
        <span>Thursday 30 July</span>
        <small>Europe/Prague</small>
      </header>
      <p className="rotate-note">Rotate your phone to landscape for the full timetable.</p>
      <div className="timetable-scroll" aria-label="Thursday timetable">
        <div className="timetable" style={{ '--timeline-height': `${totalHeight}px` } as React.CSSProperties}>
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
    </main>
  )
}
