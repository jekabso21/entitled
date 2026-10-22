import { describe, expect, it } from 'vitest'
import { cleanSnippet, toPrefixQuery } from './search-doc-pages.ts'

describe('toPrefixQuery', () => {
  it('turns words into prefix matches and drops query syntax', () => {
    expect(toPrefixQuery("Flash & fw' :* !x")).toBe('flash:* & fw:* & x:*')
    expect(toPrefixQuery('&& !!')).toBe('')
  })
})

describe('cleanSnippet', () => {
  it('removes Markdown syntax but keeps the matched-word markers', () => {
    expect(
      cleanSnippet('> [!WARNING]\n> **Unplug** the ⟦flash⟧ [cable](/x) $I = 2$ ## Setup {.tabset}'),
    ).toBe('Unplug the ⟦flash⟧ cable I = 2 Setup')
  })
})
