import { describe, expect, it } from 'vitest'
import { titleFromMarkdown } from './title-from-markdown.ts'

describe('titleFromMarkdown', () => {
  it('uses the first level-one heading', () => {
    expect(titleFromMarkdown('intro\n\n# Flashing guide\n\n## Steps', 'x.md')).toBe(
      'Flashing guide',
    )
  })

  it('falls back to the file name', () => {
    expect(titleFromMarkdown('no heading here', 'quick-start.md')).toBe('quick-start')
  })
})
