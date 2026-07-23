export type Stage = {
  id: string
  name: string
  subtitle?: string
  order: number
}

export type Performance = {
  id: string
  artist: string
  stageId: string
  start: string
  end: string
}

export const FESTIVAL_TIMEZONE = 'Europe/Prague'
export const THURSDAY_START = '2026-07-30T12:00:00+02:00'
export const THURSDAY_END = '2026-07-31T01:15:00+02:00'

export const stages: Stage[] = [
  { id: 'generator', name: 'Generator', order: 0 },
  { id: 'factory', name: 'Factory', order: 1 },
  { id: 'sound-garden', name: 'Sound Garden', order: 2 },
  { id: 'archive', name: 'Archive', subtitle: 'Modus Takeover', order: 3 },
  { id: 'bass-shelter', name: 'Bass Shelter', order: 4 },
  { id: 'port-stage', name: 'Port Stage', subtitle: 'powered by Beefeater', order: 5 },
  { id: 'saurus', name: 'Saurus', order: 6 },
]

// Source: https://letitroll.eu/time/
// Extracted from the Thursday table's stage columns and explicit data-start/data-end attributes.
export const performances: Performance[] = [
  { id: 'bass-shelter-1215-ejdm', artist: 'EJDM', stageId: 'bass-shelter', start: '2026-07-30T12:15:00+02:00', end: '2026-07-30T13:15:00+02:00' },
  { id: 'sound-garden-1230-komin-crew', artist: 'Komín crew: Blofeld, Gesiman, Magická, Twomix, Candle Sauce', stageId: 'sound-garden', start: '2026-07-30T12:30:00+02:00', end: '2026-07-30T14:30:00+02:00' },
  { id: 'saurus-1300-louccino', artist: 'Louccino', stageId: 'saurus', start: '2026-07-30T13:00:00+02:00', end: '2026-07-30T14:00:00+02:00' },
  { id: 'bass-shelter-1315-monkey-boom', artist: 'Monkey Boom: Bicman, Dickoro, Erbo, NelliQ, Vitto, Woice', stageId: 'bass-shelter', start: '2026-07-30T13:15:00+02:00', end: '2026-07-30T15:30:00+02:00' },
  { id: 'archive-1400-phonetick', artist: 'Phonetick', stageId: 'archive', start: '2026-07-30T14:00:00+02:00', end: '2026-07-30T15:00:00+02:00' },
  { id: 'port-stage-1400-neuroheadz', artist: "The Neuroheadz: Exult, Jx2 & Agg (2010's Neurofunk set)", stageId: 'port-stage', start: '2026-07-30T14:00:00+02:00', end: '2026-07-30T15:00:00+02:00' },
  { id: 'saurus-1400-dryuk', artist: 'Dryuk', stageId: 'saurus', start: '2026-07-30T14:00:00+02:00', end: '2026-07-30T15:00:00+02:00' },
  { id: 'sound-garden-1430-lixx', artist: 'Lixx', stageId: 'sound-garden', start: '2026-07-30T14:30:00+02:00', end: '2026-07-30T15:30:00+02:00' },
  { id: 'archive-1500-furious-freaks', artist: 'Furious Freaks', stageId: 'archive', start: '2026-07-30T15:00:00+02:00', end: '2026-07-30T16:30:00+02:00' },
  { id: 'saurus-1500-dcground', artist: 'DCGROUND', stageId: 'saurus', start: '2026-07-30T15:00:00+02:00', end: '2026-07-30T17:00:00+02:00' },
  { id: 'sound-garden-1530-flowanastasia', artist: 'flowanastasia & Tyr Kohout', stageId: 'sound-garden', start: '2026-07-30T15:30:00+02:00', end: '2026-07-30T16:30:00+02:00' },
  { id: 'bass-shelter-1530-dnbe-heard', artist: 'DNBe HearD. showcase: Enssen, Gexan, Giygas, Herss, Onyxia', stageId: 'bass-shelter', start: '2026-07-30T15:30:00+02:00', end: '2026-07-30T17:30:00+02:00' },
  { id: 'port-stage-1530-yue', artist: 'Yue', stageId: 'port-stage', start: '2026-07-30T15:30:00+02:00', end: '2026-07-30T16:30:00+02:00' },
  { id: 'factory-1600-tian', artist: 'Tian', stageId: 'factory', start: '2026-07-30T16:00:00+02:00', end: '2026-07-30T17:30:00+02:00' },
  { id: 'sound-garden-1630-eva-lazarus', artist: 'Eva Lazarus', stageId: 'sound-garden', start: '2026-07-30T16:30:00+02:00', end: '2026-07-30T17:30:00+02:00' },
  { id: 'archive-1630-secula', artist: 'Secula', stageId: 'archive', start: '2026-07-30T16:30:00+02:00', end: '2026-07-30T17:30:00+02:00' },
  { id: 'port-stage-1700-buunshin', artist: 'Buunshin', stageId: 'port-stage', start: '2026-07-30T17:00:00+02:00', end: '2026-07-30T18:00:00+02:00' },
  { id: 'saurus-1700-mike-helper', artist: 'Mike Helper', stageId: 'saurus', start: '2026-07-30T17:00:00+02:00', end: '2026-07-30T18:00:00+02:00' },
  { id: 'factory-1730-magenta', artist: 'Magenta', stageId: 'factory', start: '2026-07-30T17:30:00+02:00', end: '2026-07-30T18:30:00+02:00' },
  { id: 'sound-garden-1730-elipsa', artist: 'Elipsa', stageId: 'sound-garden', start: '2026-07-30T17:30:00+02:00', end: '2026-07-30T18:30:00+02:00' },
  { id: 'archive-1730-lukher', artist: 'Lukher', stageId: 'archive', start: '2026-07-30T17:30:00+02:00', end: '2026-07-30T18:30:00+02:00' },
  { id: 'bass-shelter-1730-liquidators', artist: 'Liquidators crew', stageId: 'bass-shelter', start: '2026-07-30T17:30:00+02:00', end: '2026-07-30T18:30:00+02:00' },
  { id: 'generator-1800-monty-visages', artist: 'Monty b2b Visages', stageId: 'generator', start: '2026-07-30T18:00:00+02:00', end: '2026-07-30T19:30:00+02:00' },
  { id: 'factory-1830-gifta', artist: 'Gifta', stageId: 'factory', start: '2026-07-30T18:30:00+02:00', end: '2026-07-30T19:30:00+02:00' },
  { id: 'sound-garden-1830-gardna', artist: 'Gardna', stageId: 'sound-garden', start: '2026-07-30T18:30:00+02:00', end: '2026-07-30T19:30:00+02:00' },
  { id: 'archive-1830-ragemode', artist: 'RageMode', stageId: 'archive', start: '2026-07-30T18:30:00+02:00', end: '2026-07-30T19:30:00+02:00' },
  { id: 'bass-shelter-1830-wedry', artist: 'Wedry', stageId: 'bass-shelter', start: '2026-07-30T18:30:00+02:00', end: '2026-07-30T19:30:00+02:00' },
  { id: 'generator-1930-maduk', artist: 'Maduk', stageId: 'generator', start: '2026-07-30T19:30:00+02:00', end: '2026-07-30T20:30:00+02:00' },
  { id: 'factory-1930-ama', artist: 'Ama', stageId: 'factory', start: '2026-07-30T19:30:00+02:00', end: '2026-07-30T20:30:00+02:00' },
  { id: 'sound-garden-1930-catching-cairo', artist: 'Catching Cairo', stageId: 'sound-garden', start: '2026-07-30T19:30:00+02:00', end: '2026-07-30T20:30:00+02:00' },
  { id: 'archive-1930-annix-fade-black', artist: 'Annix b2b Fade Black', stageId: 'archive', start: '2026-07-30T19:30:00+02:00', end: '2026-07-30T20:30:00+02:00' },
  { id: 'bass-shelter-1930-maelie', artist: 'MAE.LIE', stageId: 'bass-shelter', start: '2026-07-30T19:30:00+02:00', end: '2026-07-30T20:30:00+02:00' },
  { id: 'factory-2030-buunshin', artist: 'Buunshin', stageId: 'factory', start: '2026-07-30T20:30:00+02:00', end: '2026-07-30T21:30:00+02:00' },
  { id: 'sound-garden-2030-drs', artist: 'DRS: In Session (feat Dogger)', stageId: 'sound-garden', start: '2026-07-30T20:30:00+02:00', end: '2026-07-30T21:30:00+02:00' },
  { id: 'archive-2030-calyx-upbeats', artist: 'Calyx b2b The Upbeats', stageId: 'archive', start: '2026-07-30T20:30:00+02:00', end: '2026-07-30T22:00:00+02:00' },
  { id: 'bass-shelter-2030-audiocuts', artist: 'Audiocuts', stageId: 'bass-shelter', start: '2026-07-30T20:30:00+02:00', end: '2026-07-30T21:30:00+02:00' },
  { id: 'generator-2045-fox-stevenson', artist: 'Fox Stevenson (live)', stageId: 'generator', start: '2026-07-30T20:45:00+02:00', end: '2026-07-30T21:45:00+02:00' },
  { id: 'factory-2130-imanu', artist: 'Imanu', stageId: 'factory', start: '2026-07-30T21:30:00+02:00', end: '2026-07-30T22:30:00+02:00' },
  { id: 'sound-garden-2130-duskee', artist: 'Duskee', stageId: 'sound-garden', start: '2026-07-30T21:30:00+02:00', end: '2026-07-30T22:30:00+02:00' },
  { id: 'bass-shelter-2130-qzb', artist: 'QZB', stageId: 'bass-shelter', start: '2026-07-30T21:30:00+02:00', end: '2026-07-30T22:30:00+02:00' },
  { id: 'generator-2200-wilkinson', artist: 'Wilkinson', stageId: 'generator', start: '2026-07-30T22:00:00+02:00', end: '2026-07-30T23:00:00+02:00' },
  { id: 'archive-2200-camo-krooked', artist: 'Camo & Krooked', stageId: 'archive', start: '2026-07-30T22:00:00+02:00', end: '2026-07-30T23:00:00+02:00' },
  { id: 'factory-2230-synergy', artist: 'Synergy', stageId: 'factory', start: '2026-07-30T22:30:00+02:00', end: '2026-07-30T23:30:00+02:00' },
  { id: 'sound-garden-2230-flowdan', artist: 'Flowdan', stageId: 'sound-garden', start: '2026-07-30T22:30:00+02:00', end: '2026-07-30T23:30:00+02:00' },
  { id: 'bass-shelter-2230-malcuth-facutum', artist: 'Malcuth & Facutum', stageId: 'bass-shelter', start: '2026-07-30T22:30:00+02:00', end: '2026-07-30T23:30:00+02:00' },
  { id: 'generator-2300-amc-phantom', artist: 'A.M.C & MC Phantom', stageId: 'generator', start: '2026-07-30T23:00:00+02:00', end: '2026-07-31T00:00:00+02:00' },
  { id: 'archive-2300-break', artist: 'Break', stageId: 'archive', start: '2026-07-30T23:00:00+02:00', end: '2026-07-31T00:00:00+02:00' },
  { id: 'factory-2330-current-value', artist: 'Current Value', stageId: 'factory', start: '2026-07-30T23:30:00+02:00', end: '2026-07-31T01:00:00+02:00' },
  { id: 'sound-garden-2330-this-is-inja', artist: 'This Is Inja', stageId: 'sound-garden', start: '2026-07-30T23:30:00+02:00', end: '2026-07-31T01:00:00+02:00' },
  { id: 'bass-shelter-2330-upfockerz', artist: 'Upfockerz', stageId: 'bass-shelter', start: '2026-07-30T23:30:00+02:00', end: '2026-07-31T01:00:00+02:00' },
  { id: 'generator-0000-sota', artist: 'Sota', stageId: 'generator', start: '2026-07-31T00:00:00+02:00', end: '2026-07-31T01:00:00+02:00' },
  { id: 'archive-0000-mefjus', artist: 'Mefjus', stageId: 'archive', start: '2026-07-31T00:00:00+02:00', end: '2026-07-31T01:00:00+02:00' },
]
