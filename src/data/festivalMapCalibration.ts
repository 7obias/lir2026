export type FestivalMapControlPoint = {
  latitude: number
  longitude: number
  xPercent: number
  yPercent: number
  label: string
}

/**
 * Approximate control points measured against the official illustrated map.
 *
 * Geographic references are the official 2026 visitor navigation pins for the
 * campsite areas and festival approach. The image is illustrative rather than
 * surveyed, so projected positions are intentionally presented as approximate.
 * https://letitroll.cz/akce/let-it-roll-2026/
 */
export const festivalMapControlPoints: FestivalMapControlPoint[] = [
  {
    latitude: 50.5272947,
    longitude: 13.65022,
    xPercent: 80.8,
    yPercent: 44.3,
    label: 'Car & Tent Spot',
  },
  {
    latitude: 50.5257954,
    longitude: 13.6770626,
    xPercent: 82.4,
    yPercent: 34.8,
    label: 'Caravan Spot',
  },
  {
    latitude: 50.516139,
    longitude: 13.6480396,
    xPercent: 55.8,
    yPercent: 95.7,
    label: 'Accreditation approach',
  },
]
