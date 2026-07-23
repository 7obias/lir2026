# Let It Roll 2026 — Thursday timetable

A deliberately minimal, mobile-first timetable viewer for **Thursday 30 July 2026**. It presents seven stages in a compact time grid designed primarily for an iPhone Max-sized device in landscape orientation.

The application is display-only: there are no accounts, planning tools, selections, imports, editing controls, databases, or runtime APIs.

## Official timetable source

Thursday performance data was extracted from the official timetable:

https://letitroll.eu/time/

The official page provides a semantic HTML table with stage headers and performance cells containing explicit `data-start` and `data-end` values. The local data file preserves those stage relationships and times. The deployed app does not fetch or scrape the official website at runtime.

The timetable may change. Check the official source for the latest information.

## Current scope

- Thursday 30 July 2026 only
- Generator
- Factory
- Sound Garden
- Archive — Modus Takeover
- Bass Shelter
- Port Stage — powered by Beefeater
- Saurus
- Complete Thursday programme through 01:00 on Friday morning
- Europe/Prague time and 24-hour labels
- Live or session-only simulated time with a matching timetable cursor

Landscape orientation is strongly recommended. At common iPhone landscape widths, the time column and all seven stage columns fit without horizontal panning. Portrait orientation displays a rotation recommendation and allows horizontal scrolling as a fallback.

## Local setup

Requires a current Node.js LTS release and npm.

```sh
npm install
npm run dev
```

## Checks and production build

```sh
npm run lint
npm test -- --run
npm run build
npm run preview
```

The production output is written to `dist`.

## PWA and iPhone installation

The app includes a basic standalone manifest and offline service worker. After one successful online visit, the application shell and local timetable data are available offline.

On iPhone, open the deployed page in Safari, tap **Share**, then **Add to Home Screen**. Landscape orientation provides the intended full timetable layout.

## GitHub Pages deployment

The workflow in `.github/workflows/deploy.yml` builds and deploys `dist` on pushes to `main`.

Set:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

The expected URL is:

https://7obias.github.io/lir2026/

Vite’s base path must remain exactly `/lir2026/` for project-page assets, the manifest, and service-worker navigation to resolve correctly.
