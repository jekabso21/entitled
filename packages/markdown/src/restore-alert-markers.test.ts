import { describe, expect, it } from 'vitest'
import { restoreAlertMarkers } from './restore-alert-markers.ts'

describe('restoreAlertMarkers', () => {
  it('unescapes GitHub alert markers that an editor escaped', () => {
    expect(restoreAlertMarkers('> \\[!TIP\\]\n> Keep it updated.')).toBe(
      '> [!TIP]\n> Keep it updated.',
    )
  })

  it('handles nested quotes and lower-case kinds', () => {
    expect(restoreAlertMarkers('> > \\[!warning\\]')).toBe('> > [!WARNING]')
  })

  it('leaves escaped brackets in ordinary text alone', () => {
    const text = 'Use \\[!TIP\\] syntax in a quote to make a callout.'
    expect(restoreAlertMarkers(text)).toBe(text)
  })
})
