# LIR 2026 Planner

LIR 2026 Planner is a polished, offline-first personal timetable and visit planner for the 2026 festival dates at Lake Most. It helps answer what is playing now, what is next on your plan, when to leave, which selections clash, and how much of overlapping sets can realistically be attended.

> **The bundled timetable is demo data and is not the official Let It Roll 2026 timetable.**

The application is a completely static Progressive Web App. There is no backend, login, remote database, analytics service, runtime API, or secret key. Personal data remains in the browser.

## Main features

- Vertical, horizontally scrollable stage timeline with sticky labels, day/filter controls, after-midnight sets, current-time indication, and details sheet
- Alphabetical artist discovery with search, genre filtering, repeat appearances, and per-performance priorities
- Chronological My Plan with Must see filtering, overlap durations, directional transfer warnings, and calculated split-set suggestions
- Simplified Now screen using `Europe/Prague`, including current and next sets, departure countdown, transfer estimate, and preview time
- IndexedDB persistence with separate timetable, selection, settings, and import stores
- Browser-only quoted CSV import with validation, duplicate detection, deterministic IDs, preview, confirmation, and selection preservation
- Personal-plan and complete-data JSON backup/restore
- System/light/dark themes, safe-area-aware bottom navigation, offline shell, and service-worker update prompt

## Screens

The five state-based screens are Timeline, Artists, My Plan, Now, and Settings. State-based navigation avoids GitHub Pages route-refresh 404 errors.

## Technology stack

React, TypeScript (strict), Vite, `vite-plugin-pwa`, IndexedDB through `idb`, date-fns/date-fns-tz, Vitest, React Testing Library, ESLint, and local CSS. No runtime CDN assets are used.

## Project structure

```text
src/
  app/          shared application state
  components/   reusable UI
  data/         clearly marked bundled demo timetable
  db/           IndexedDB repository abstraction
  models/       domain types and schema constants
  pages/        five primary screens
  services/     CSV and data workflows
  styles/       design tokens and responsive styling
  test/         test setup
  utils/        IDs, schedule, conflicts, transfers, timezone logic
public/         icons and example CSV
.github/        GitHub Pages workflow
```

## Prerequisites and installation

Use Node.js 22 and npm.

```sh
npm install
```

For a clean lockfile-based install (including CI), use `npm ci`.

## Development and scripts

```sh
npm run dev          # local Vite development server
npm run typecheck    # strict TypeScript check
npm run lint         # ESLint
npm test             # test watch mode
npm test -- --run    # one deterministic test run
npm run test:watch   # explicit watch mode
npm run build        # typecheck and production build to dist/
npm run preview      # preview the production build
```

## Production build and preview

Run `npm run build`, then `npm run preview`. Vite writes the production site to `dist`. Preview URLs retain the `/lir2026/` base, so open the URL Vite prints with that path.

## GitHub Pages deployment

The workflow at `.github/workflows/deploy.yml` runs on every push to `main` and by manual dispatch. It uses `npm ci`, lint, tests, build, and the official Pages artifact/deployment actions. The contents of `dist` are uploaded.

In GitHub, select:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

Expected production URL: **https://7obias.github.io/lir2026/**

`vite.config.ts` intentionally uses exactly `base: "/lir2026/"`. GitHub Pages serves project sites beneath the repository name; changing this to `/` causes asset 404s. If the GitHub owner changes but the repository stays `lir2026`, the base remains unchanged. If the repository name changes, update the Vite base, PWA manifest `id`/`start_url`/`scope`, HTML icon path, Workbox fallback, workflow documentation, and production URL together.

## Installation on phones

### iPhone

Open the production page in Safari, tap Share, then Add to Home Screen. iOS does not expose a browser-controlled install prompt. If Add to Home Screen is missing, confirm the page is open in Safari (not an in-app browser), then scroll the Share sheet or choose Edit Actions.

### Android

Open the page in Chrome, use the browser menu, and select Install app or Add to Home screen. Installation availability depends on a successful HTTPS visit and service-worker registration.

Browser notifications have platform/version/permission limitations on iOS, especially outside an installed Home Screen app. This version stores reminder lead times for planning but does not claim guaranteed background notification delivery.

## Offline testing

1. Build and serve with `npm run preview`.
2. Visit `/lir2026/` once while online and wait for the service worker to activate.
3. In browser developer tools, switch Network to Offline.
4. Reload the same URL and move between all five screens.
5. Close and reopen the installed PWA and verify selections remain.

The application shell and bundled demo data are precached. IndexedDB is independent of the service-worker cache, so updates do not erase plans.

## Storage and privacy

Festival metadata, days, stages, artists, performances, selections, settings, and import metadata have separate IndexedDB stores. The repository abstraction in `src/db` owns low-level storage access. First use seeds demo data. Normal upgrades do not replace imported schedules. Browser storage clearing, private-browsing eviction, or uninstall behavior may still remove data, so export a complete backup before clearing site data.

All plan and timetable data remains in the browser unless the user explicitly downloads a backup. No data is uploaded.

## Timetable CSV format

CSV processing is local. The header must be exactly:

```csv
day,stage,artist,start,end,genres
```

Example:

```csv
day,stage,artist,start,end,genres
2026-07-30,Mothership,Aphrodite,22:00,23:00,jungle
2026-07-30,Temple,Current Value,22:30,23:30,neurofunk
```

An example is available at `public/examples/lir-timetable-example.csv` and through Settings. Values may be quoted, including escaped double quotes. Dates use `YYYY-MM-DD`; times use 24-hour `HH:mm`; multiple genres may be separated with `;` or `|`. An end time earlier than the start is treated as crossing midnight.

Import validates the header, required fields, dates, times, equal start/end values, and duplicate normalized rows. A preview reports days, stages, artists, performances, and invalid rows. Invalid rows include row numbers. Saving requires confirmation and replaces only timetable data. Existing selections survive when deterministic performance IDs still match.

IDs use normalized festival ID, festival date, stage, artist, and start time. Case and whitespace changes normalize consistently.

## JSON backup and restore

Personal-plan export contains the schema version and selections (including notes and reminder lead times). Import adds compatible selections whose performance IDs exist in the loaded timetable. Complete-data export includes timetable, artists, performances, selections, settings, and schema version. Complete restore validates required structure and rejects unsupported newer schemas. Malformed JSON shows a user-friendly message.

## Demo timetable and replacing it

The bundled demo covers Thursday 30 July, Friday 31 July, and Saturday 1 August 2026, with four stages, 48 performances, overlaps, gaps, repeated artists, and sets crossing midnight. Times and stages are fictional planning data and are not official.

Replace it in Settings → Timetable import by selecting a compatible local CSV, reviewing the preview, and confirming. Restore it later with Reset timetable to demo data. Timetable replacement does not reset settings and preserves matching selections.

## Troubleshooting

- **Blank GitHub Pages screen:** inspect the browser console/network tab for missing assets and confirm the Pages job succeeded.
- **Incorrect Vite base path:** `vite.config.ts` must contain `base: "/lir2026/"`, not `/`.
- **GitHub Pages 404:** open `https://7obias.github.io/lir2026/`; the app uses state navigation and requires no route rewrite.
- **Failed Actions deployment:** open the Actions run, inspect the first failed lint/test/build step, and confirm Pages Source is GitHub Actions.
- **Stale service worker / old version:** use the in-app update button, close all installed-app tabs, reopen, or unregister the worker and clear only Cache Storage. Avoid clearing IndexedDB unless a backup exists.
- **PWA not installable:** use HTTPS, allow the first load to finish, verify manifest/service-worker requests, and revisit once.
- **iPhone Add to Home Screen missing:** use Safari directly and find Add to Home Screen in the Share sheet.
- **IndexedDB reset concerns:** service-worker updates do not reset IndexedDB; browser site-data clearing can. Export a complete backup first.
- **Offline mode not working:** complete one successful online visit, wait for service-worker activation, then test the same `/lir2026/` URL.

## Development and contribution notes

Read `AGENTS.md` before changes. Keep timetable and personal data separate, retain deterministic IDs and Prague time, add deterministic tests for logic changes, and run typecheck, lint, tests, and build before opening a pull request. Do not commit `dist`, `node_modules`, secrets, copyrighted festival artwork, or artist imagery.
