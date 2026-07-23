# Contributor notes

This repository is intentionally a single-screen, display-only Thursday timetable.

- Keep `src/App.tsx` focused on rendering the timetable.
- Keep official static data in `src/data/thursdayTimetable.ts`.
- Do not add planning, selection, persistence, import, editing, routing, or account features without explicit approval.
- Preserve explicit Europe/Prague ISO timestamps and after-midnight ordering.
- Keep the seven-column landscape layout visible without horizontal panning at iPhone Max landscape widths.
- Keep Vite `base` exactly `/lir2026/` and asset paths subpath-safe.
- Timetable data and source comments must remain traceable to `https://letitroll.eu/time/`.
- Before finishing changes, run `npm run lint`, `npm test -- --run`, and `npm run build`.
