import { describe, expect, it } from 'vitest'
import { findDocPageLinks } from './doc-page-links.ts'
import { diffLines } from './line-diff.ts'

describe('diffLines', () => {
  it('marks changed lines and keeps unchanged ones in order', () => {
    expect(diffLines('a\nb\nc', 'a\nB\nc\nd')).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'added', text: 'B' },
      { kind: 'removed', text: 'b' },
      { kind: 'same', text: 'c' },
      { kind: 'added', text: 'd' },
    ])
  })

  it('reports identical texts as unchanged', () => {
    expect(diffLines('x\ny', 'x\ny').every((line) => line.kind === 'same')).toBe(true)
  })

  it('stays fast on large pages with a small edit', () => {
    const before = Array.from({ length: 5000 }, (_, index) => `line ${String(index)}`).join('\n')
    const after = before.replace('line 2500', 'line 2500 edited')
    const changed = diffLines(before, after).filter((line) => line.kind !== 'same')
    expect(changed).toEqual([
      { kind: 'added', text: 'line 2500 edited' },
      { kind: 'removed', text: 'line 2500' },
    ])
  })
})

describe('findDocPageLinks', () => {
  it('finds links to docs pages, with or without a heading anchor', () => {
    const product = '0199a1b2-0000-7000-8000-000000000001'
    const page = '0199a1b2-0000-7000-8000-000000000002'
    const markdown = `See [Wiring](/products/${product}/docs/${page}#power) and [site](https://x.dev).`
    expect(findDocPageLinks(markdown)).toEqual([
      { text: 'Wiring', productId: product, pageId: page },
    ])
  })
})
