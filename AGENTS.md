# LIR 2026 Planner contributor notes

## Purpose and architecture

This is an offline-first, static React/TypeScript PWA for planning festival visits at Lake Most. Vite builds the application for GitHub Pages. React UI lives in `src/pages` and `src/components`; domain models are in `src/models`; pure scheduling logic is in `src/utils`; data import is in `src/services`; and all IndexedDB access goes through `src/db`.

## Invariants

- Keep TypeScript strict and prefer explicit domain types.
- Keep timetable data and personal selections/settings in separate IndexedDB stores.
- Never overwrite an imported timetable during an ordinary app upgrade.
- Performance IDs must remain deterministic and based on normalized schedule values.
- Use `Europe/Prague` for every festival-time calculation.
- Keep Vite `base` exactly `/lir2026/` and all assets subpath-safe.
- Keep navigation state-based or hash-based so GitHub Pages refreshes do not 404.
- Do not add a backend, authentication, or remote database without explicit approval.
- Do not add copyrighted festival or artist imagery.
- Preserve backward compatibility for exported data where practical; reject unsupported newer schemas safely.

## Required checks

Before completing work, run:

```sh
npm run typecheck
npm run lint
npm test -- --run
npm run build
```

Add deterministic tests for schedule, timezone, persistence, import, and user-facing behavior changes. Do not rely on the real clock unless it is deliberately mocked.
