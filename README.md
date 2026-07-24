# Let It Roll 2026 — Thursday timetable

A deliberately minimal, mobile-first timetable viewer for **Thursday 30 July 2026**. It presents seven stages in a compact time grid designed primarily for an iPhone Max-sized device in landscape orientation.

The application has no accounts, planning tools, imports, editing controls, databases, or remote runtime APIs. Liked sets are stored locally in the browser.

## Official timetable source

Thursday performance data was extracted from the official timetable:

https://letitroll.eu/time/

The official page provides a semantic HTML table with stage headers and performance cells containing explicit `data-start` and `data-end` values. The local data file preserves those stage relationships and times. The deployed app does not fetch or scrape the official website at runtime.

The timetable may change. Check the official source for the latest information.

The bundled interactive festival map is the official full-resolution 2026 map:

https://letitroll.at/wp-content/uploads/maps/lir26_map.jpg

It is stored locally with the app and is not fetched from the source website at runtime.

The compact header uses the official transparent white wordmark published by the
festival website:

https://letitroll.eu/wp-content/uploads/2025/06/LIR_WEB_header_truesize.png

The square header emblem and every browser, Apple touch, and installed-PWA icon
are derived from `public/logo.png`. `npm run build` regenerates those icon sizes
from that single local source before compiling the application.

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
- Past/current/upcoming performance states based on the active timetable time
- Timetable-only two-finger zoom from 1× to 2.5× with sticky stage and time headers
- Persistent set liking through the explicit Like Mode
- Stage headings open the locally bundled festival map at the selected stage
- Optional, permission-gated live position and compass direction on the festival map
- iPhone landscape safe-area insets for the sticky time rail

Landscape orientation is strongly recommended. At common iPhone landscape widths, the time column and all seven stage columns fit without horizontal panning. Portrait orientation allows horizontal scrolling as a fallback.

Stage headings open the locally bundled official festival map. Its optional location
button requests GPS and compass access only after it is pressed. Position and direction
are processed only in the browser, are never stored or transmitted, and stop updating
when the map closes.

The illustrated map has no authoritative geographic coordinate system and the app
ships with **no guessed calibration points**. Real GPS placement remains unavailable
until field calibration has supplied at least two active points; two points are clearly
marked provisional, while three or more well-separated points use a local-metre affine
fit. The interface never claims surveyed or centimetre-level accuracy.

## Field map calibration

The map toolbar always shows a crosshairs button beside the location button. It opens a
compact coordinate form where coordinates can be entered manually, pasted as
`latitude, longitude`, or populated from the browser’s current location. Captured
coordinates remain editable before continuing.

The field workflow is:

1. Stand at an identifiable landmark and press the crosshairs button.
2. Enter coordinates or enable **Use current location**, then press **OK**.
3. Deliberately tap the corresponding point on the illustrated map.
4. Review the coordinate and crosshair preview, then explicitly save it or choose another point.
5. Repeat at three or more widely separated landmarks (four or more are recommended).
6. Review recorded-versus-predicted markers, residual errors, and flagged outliers.
7. Drag points to fine-tune them, replace GPS readings, exclude or delete bad points,
   and export the verified JSON.

Calibration is stored separately in local storage under
`lir2026.map-calibration.v1`. It can be exported and imported as JSON; only reviewed,
field-verified points should later be committed to
`src/data/festivalMapCalibration.ts`. Resetting all points requires confirmation.
GPS simulation is a separate visual test mode and never creates calibration points.
Its latitude and longitude dialog accepts the same Google Maps paste formats as
calibration. The entered geographic coordinate is projected through the active
calibration immediately; simulation never requires an image tap.

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

The app includes a basic standalone manifest and offline service worker. After one successful online visit, the application shell, timetable data, and festival map are available offline.

On iPhone, open the deployed page in Safari, tap **Share**, then **Add to Home Screen**. Landscape orientation provides the intended full timetable layout.

## GitHub Pages deployment

The workflow in `.github/workflows/deploy.yml` builds and deploys `dist` on pushes to `main`.

Set:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

The expected URL is:

https://7obias.github.io/lir2026/

Vite’s base path must remain exactly `/lir2026/` for project-page assets, the manifest, and service-worker navigation to resolve correctly.
