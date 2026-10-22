import { describe, expect, it } from 'vitest'
import { renderDocument } from './render-markdown.ts'

describe('renderDocument', () => {
  it('gives section headings anchors and lists them as the table of contents', async () => {
    const { html, headings } = await renderDocument(
      '# Manual\n\n## Wiring the unit\n\n### Power\n\n## Wiring the unit',
    )
    expect(html).toContain('<h2 id="wiring-the-unit">')
    expect(html).toContain('href="#wiring-the-unit"')
    expect(headings).toEqual([
      { id: 'wiring-the-unit', text: 'Wiring the unit', depth: 2 },
      { id: 'power', text: 'Power', depth: 3 },
      { id: 'wiring-the-unit-1', text: 'Wiring the unit', depth: 2 },
    ])
  })

  it('turns the sub-headings under a {.tabset} heading into tabs', async () => {
    const markdown = [
      '## Flashing {.tabset}',
      'Pick your system.',
      '### Windows',
      'Run `flash.exe`.',
      '### Linux',
      'Run `./flash`.',
      '## Next steps',
    ].join('\n\n')
    const { html, headings } = await renderDocument(markdown)
    expect(html).toContain('<div class="doc-tabs">')
    expect(html).toContain('role="tab"')
    expect(html).toContain('>Windows</button>')
    expect(html).toMatch(/role="tabpanel"[^>]*hidden/)
    expect(html).not.toContain('{.tabset}')
    expect(html.indexOf('Pick your system.')).toBeLessThan(html.indexOf('doc-tabs'))
    expect(headings.map((heading) => heading.text)).toEqual(['Flashing', 'Next steps'])
  })

  it('renders inline and display math with KaTeX', async () => {
    const { html } = await renderDocument('Power is $P = VI$.\n\n$$\nI = \\frac{P}{V}\n$$')
    expect(html).toContain('class="katex"')
    expect(html).toContain('katex-display')
  })

  it('shows invalid math as an error instead of failing the page', async () => {
    const { html } = await renderDocument('$\\frac{1$')
    expect(html).toContain('katex-error')
  })

  it('still strips scripts that sit inside a tab', async () => {
    const markdown = '## Setup {.tabset}\n\n### One\n\n<script>alert(1)</script>\n\n### Two'
    const { html } = await renderDocument(markdown)
    expect(html).not.toContain('<script')
  })
})
