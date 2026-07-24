# Contributor notes

This repository is intentionally a single-screen, display-only multi-day festival timetable.

- Keep `src/App.tsx` focused on rendering the timetable.
- Keep official static data in `src/data/`; preserve the existing Thursday IDs when updating data.
- Derive available day controls from `festivalDays`, and persist selected days by stable ISO ID.
- Do not add planning screens, routing, accounts, or remote runtime data without explicit approval.
- Preserve explicit Europe/Prague ISO timestamps and after-midnight ordering.
- Keep each day’s stage columns visible without horizontal panning at iPhone Max landscape widths.
- Keep Vite `base` exactly `/lir2026/` and asset paths subpath-safe.
- Timetable data and source comments must remain traceable to `https://letitroll.eu/time/`.
- Before finishing changes, run `npm run lint`, `npm test -- --run`, and `npm run build`.
