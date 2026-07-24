import { describe, expect, it } from 'vitest'
import {
  artistImageSearchLinkAttributes,
  artistImageSearchUrl,
} from './useArtistSearchMode'

describe('artist image search', () => {
  it('builds the expected encoded Google Images DJ query', () => {
    expect(artistImageSearchUrl('A.M.C')).toBe(
      'https://www.google.com/search?tbm=isch&q=A.M.C%20DJ',
    )
    expect(artistImageSearchUrl('Camo & Krooked')).toBe(
      'https://www.google.com/search?tbm=isch&q=Camo%20%26%20Krooked%20DJ',
    )
  })

  it('trims surrounding artist whitespace before adding the DJ qualifier', () => {
    expect(artistImageSearchUrl('  IMANU  ')).toBe(
      'https://www.google.com/search?tbm=isch&q=IMANU%20DJ',
    )
  })

  it('opens externally without granting the search page an opener or referrer', () => {
    expect(artistImageSearchLinkAttributes('A.M.C')).toEqual({
      href: 'https://www.google.com/search?tbm=isch&q=A.M.C%20DJ',
      target: '_blank',
      rel: 'noopener noreferrer',
      referrerPolicy: 'no-referrer',
    })
  })
})
