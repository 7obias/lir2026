export const DemoNotice = () => <div className="demo-notice" role="status"><span>DEMO DATA</span> Demo timetable — not the official Let It Roll 2026 schedule.</div>
export const EmptyState = ({ title, children }: { title: string; children: React.ReactNode }) => <div className="empty-state"><div aria-hidden="true">◇</div><h2>{title}</h2><p>{children}</p></div>
export function ConfirmDialog({ title, children, confirmLabel, onConfirm, onClose }: { title: string; children: React.ReactNode; confirmLabel: string; onConfirm: () => void; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation"><div className="confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
    <h2 id="confirm-title">{title}</h2><p>{children}</p><div className="actions"><button onClick={onClose}>Cancel</button><button className="danger" onClick={onConfirm}>{confirmLabel}</button></div>
  </div></div>
}
