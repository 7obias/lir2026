import { describe, expect, it } from 'vitest'
import { parseTimetableCsv } from './csv'
const header = 'day,stage,artist,start,end,genres\n'
describe('CSV import', () => {
  it('parses valid quoted CSV with stable IDs', () => { const text = header + '2026-07-30,"Main, Hall",Aphrodite,22:00,23:00,jungle'; const one = parseTimetableCsv(text); const two = parseTimetableCsv(text); expect(one.performances).toHaveLength(1); expect(one.performances[0].id).toBe(two.performances[0].id) })
  it('rejects invalid header', () => expect(parseTimetableCsv('date,artist\nx,y').errors[0].message).toMatch(/Header/))
  it('reports invalid dates and times', () => { expect(parseTimetableCsv(header+'30-07-2026,A,B,22:00,23:00,x').errors[0].message).toMatch(/date/); expect(parseTimetableCsv(header+'2026-07-30,A,B,25:00,23:00,x').errors[0].message).toMatch(/time/) })
  it('handles crossing midnight', () => { const result = parseTimetableCsv(header+'2026-07-30,A,B,23:30,01:00,x'); expect(result.errors).toHaveLength(0); expect(new Date(result.performances[0].end).getTime()).toBeGreaterThan(new Date(result.performances[0].start).getTime()) })
  it('rejects duplicate rows', () => { const row='2026-07-30,A,B,23:30,01:00,x'; const result=parseTimetableCsv(header+row+'\n'+row); expect(result.performances).toHaveLength(1); expect(result.duplicateCount).toBe(1); expect(result.errors[0].message).toMatch(/Duplicate/) })
})
