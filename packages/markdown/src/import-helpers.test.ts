import { describe, expect, it } from 'vitest'
import {
  findLocalFileRefs,
  normalizeLocalPath,
  replaceFileRefs,
  unlinkFileRefs,
} from './local-file-refs.ts'
import { type PdfTextItem, pdfLayoutToMarkdown } from './pdf-layout-to-markdown.ts'
import { groupUnderTitle, splitMarkdownIntoPages, suggestSplit } from './split-markdown-pages.ts'

const manual = `# Controller manual

Read this first.

## Installation

Mount the unit.

### Wiring

Connect power.

\`\`\`sh
# not a heading
flash.sh
\`\`\`

## Troubleshooting

Check the LED.
`

describe('splitMarkdownIntoPages', () => {
  it('suggests pages per H2 with sub-pages per H3 when the H1 is the document title', () => {
    expect(suggestSplit(manual)).toEqual({ pageLevel: 2, subPageLevel: 3 })
  })

  it('splits into pages and sub-pages and keeps the intro under the document title', () => {
    const pages = splitMarkdownIntoPages(manual, {
      pageLevel: 2,
      subPageLevel: 3,
      fallbackTitle: 'manual.md',
    })
    expect(pages.map(({ title, depth }) => [title, depth])).toEqual([
      ['Controller manual', 0],
      ['Installation', 0],
      ['Wiring', 1],
      ['Troubleshooting', 0],
    ])
    expect(pages[0]?.body).toBe('Read this first.')
    expect(pages[2]?.body).toContain('# not a heading')
  })

  it('keeps everything on one page titled by the H1', () => {
    const [page, ...rest] = splitMarkdownIntoPages(manual, {
      pageLevel: null,
      subPageLevel: null,
      fallbackTitle: 'manual.md',
    })
    expect(rest).toEqual([])
    expect(page?.title).toBe('Controller manual')
    expect(page?.body).toMatch(/^Read this first\.\n\n## Installation/)
  })

  it('promotes remaining headings so a page body starts at H2', () => {
    const [page] = splitMarkdownIntoPages('## A\n\n#### Deep\n\ntext', {
      pageLevel: 2,
      subPageLevel: null,
      fallbackTitle: 'x',
    })
    expect(page?.body).toBe('## Deep\n\ntext')
  })
})

describe('groupUnderTitle', () => {
  it('nests the pages under the intro page named after the document', () => {
    const pages = splitMarkdownIntoPages(manual, {
      pageLevel: 2,
      subPageLevel: 3,
      fallbackTitle: 'manual.md',
    })
    expect(
      groupUnderTitle(pages, 'Controller manual').map(({ title, depth }) => [title, depth]),
    ).toEqual([
      ['Controller manual', 0],
      ['Installation', 1],
      ['Wiring', 2],
      ['Troubleshooting', 1],
    ])
  })

  it('adds an empty section page when the document has no intro', () => {
    const grouped = groupUnderTitle([{ title: 'Setup', body: 'x', depth: 0 }], 'Guide')
    expect(grouped).toEqual([
      { title: 'Guide', body: '', depth: 0 },
      { title: 'Setup', body: 'x', depth: 1 },
    ])
  })
})

describe('local file references', () => {
  it('replaces references to missing files with their text', () => {
    const markdown =
      'See [the datasheet](files/ds.pdf) and ![Pinout](pin.png) and [site](https://x.test).'
    expect(unlinkFileRefs(markdown, new Set(['files/ds.pdf', 'pin.png']))).toBe(
      'See the datasheet and Pinout and [site](https://x.test).',
    )
  })

  it('finds relative images and links and rewrites them', () => {
    const markdown =
      '![Pinout](img/pin%20out.png) [Datasheet](./ds.pdf "PDF") ![Logo](https://x.test/a.png) [Top](#top)'
    expect(findLocalFileRefs(markdown)).toEqual(['img/pin%20out.png', './ds.pdf'])
    expect(normalizeLocalPath('img/pin%20out.png')).toBe('img/pin out.png')
    const rewritten = replaceFileRefs(
      markdown,
      new Map([
        ['img/pin%20out.png', '/api/doc-assets/1/pin-out.png'],
        ['./ds.pdf', '/api/doc-assets/2/ds.pdf'],
      ]),
    )
    expect(rewritten).toBe(
      '![Pinout](/api/doc-assets/1/pin-out.png) [Datasheet](/api/doc-assets/2/ds.pdf "PDF") ![Logo](https://x.test/a.png) [Top](#top)',
    )
  })
})

describe('pdfLayoutToMarkdown', () => {
  const text = (value: string, y: number, options: Partial<PdfTextItem> = {}): PdfTextItem => ({
    text: value,
    x: 72,
    y,
    width: value.length * 5,
    fontSize: 10,
    isBold: false,
    isMono: false,
    ...options,
  })
  const page = (items: PdfTextItem[], images: { y: number; ref: string }[] = []) => ({
    width: 600,
    height: 800,
    items,
    images: images.map((image) => ({ ...image, x: 72, width: 100, height: 50 })),
  })

  it('turns font sizes into headings and joins wrapped lines into paragraphs', () => {
    const markdown = pdfLayoutToMarkdown([
      page([
        text('User manual', 700, { fontSize: 24 }),
        text('Installation', 660, { fontSize: 16 }),
        text('Mount the controller on a DIN rail and', 640),
        text('tighten both clamps.', 628),
        text('Safety', 600, { isBold: true }),
        text('Always disconnect power.', 585),
      ]),
    ])
    expect(markdown).toBe(
      '# User manual\n\n## Installation\n\nMount the controller on a DIN rail and tighten both clamps.\n\n### Safety\n\nAlways disconnect power.\n',
    )
  })

  it('detects lists, code and images and drops running footers and page numbers', () => {
    const footer = (n: number) => [
      text('ACME Corp confidential', 40),
      text(String(n), 30, { x: 300 }),
    ]
    const markdown = pdfLayoutToMarkdown([
      page(
        [
          text('Steps', 700, { fontSize: 16 }),
          text('• Unpack the unit', 680),
          text('1. Plug in USB', 665),
          text('flash --port /dev/ttyUSB0', 640, { isMono: true }),
          text('Done.', 560),
          ...footer(1),
        ],
        [{ y: 620, ref: 'asset:0' }],
      ),
      page([text('More text.', 700), ...footer(2)]),
      page([text('Even more.', 700), ...footer(3)]),
    ])
    expect(markdown).toBe(
      '# Steps\n\n- Unpack the unit\n\n1. Plug in USB\n\n```\nflash --port /dev/ttyUSB0\n```\n\n![](asset:0)\n\nDone.\n\nMore text.\n\nEven more.\n',
    )
  })

  it('reads indented lines without bullet glyphs as a tight list and drops a two-page footer', () => {
    const markdown = pdfLayoutToMarkdown([
      page([
        text('Connect the power supply first.', 700),
        text('Use 24 V DC with at least 2 A.', 680, { x: 102 }),
        text('Keep motor cables away from signal', 668, { x: 102 }),
        text('lines and relays.', 656, { x: 102 }),
        text('Then close the cabinet.', 630),
        text('ACME Robotics · 1', 20, { x: 270 }),
      ]),
      page([text('Next page.', 700), text('ACME Robotics · 2', 20, { x: 270 })]),
    ])
    expect(markdown).toBe(
      'Connect the power supply first.\n\n- Use 24 V DC with at least 2 A.\n- Keep motor cables away from signal lines and relays.\n\nThen close the cabinet.\n\nNext page.\n',
    )
  })
})
