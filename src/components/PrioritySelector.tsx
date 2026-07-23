import type { Priority } from '../models'
import { priorityLabels } from '../models'
export function PrioritySelector({ value, onChange, compact = false }: { value: Priority; onChange: (value: Priority) => void; compact?: boolean }) {
  return <fieldset className={`priority-selector ${compact ? 'compact' : ''}`}><legend className="sr-only">Performance priority</legend>
    {(['must-see', 'interested', 'unselected', 'skip'] as Priority[]).map((priority) =>
      <button type="button" key={priority} className={`priority priority-${priority}`} aria-pressed={value === priority} onClick={() => onChange(priority)}>
        <span aria-hidden="true">{priority === 'must-see' ? '★' : priority === 'interested' ? '＋' : priority === 'skip' ? '×' : '○'}</span> {priorityLabels[priority]}
      </button>)}
  </fieldset>
}
