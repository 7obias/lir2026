export type View = 'timeline' | 'artists' | 'plan' | 'now' | 'settings'
const items: [View, string, string][] = [['timeline', 'Timeline', '▥'], ['artists', 'Artists', '◉'], ['plan', 'My Plan', '✓'], ['now', 'Now', '●'], ['settings', 'Settings', '⚙']]
export function BottomNav({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  return <nav className="bottom-nav" aria-label="Primary navigation">{items.map(([id, label, icon]) =>
    <button key={id} aria-current={view === id ? 'page' : undefined} onClick={() => onChange(id)}><span aria-hidden="true">{icon}</span>{label}</button>)}</nav>
}
