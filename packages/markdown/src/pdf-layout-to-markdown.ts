import { BlockWriter, type PdfLine as Line } from './pdf-block-writer.ts'

// Coordinates are PDF user space: origin bottom-left, y grows upwards. `y` of a text item is
// its baseline; `y` of an image is its top edge.
export type PdfTextItem = {
  text: string
  x: number
  y: number
  width: number
  fontSize: number
  isBold: boolean
  isMono: boolean
}

export type PdfImage = { x: number; y: number; width: number; height: number; ref: string }

export type PdfPageLayout = {
  width: number
  height: number
  items: readonly PdfTextItem[]
  images: readonly PdfImage[]
}

type Element =
  { kind: 'line'; line: Line; top: number } | { kind: 'image'; image: PdfImage; top: number }

const BULLET = /^[•◦▪▫‣∙●○■□–*-]\s*/
const NUMBERED = /^\(?(\d{1,3}|[a-z])[.)]\s+/
const PAGE_NUMBER = /^(page\s*)?\d+(\s*(of|\/)\s*\d+)?$/i

function escapeText(text: string) {
  return text.replace(/([\\*`<])/g, '\\$1')
}

function round(size: number) {
  return Math.round(size * 2) / 2
}

function buildLines(page: PdfPageLayout, pageIndex: number): Line[] {
  const groups: PdfTextItem[][] = []
  for (const item of page.items) {
    if (item.text === '') continue
    const current = groups.at(-1)
    const anchor = current?.[0]
    if (
      current &&
      anchor &&
      Math.abs(anchor.y - item.y) <= Math.max(anchor.fontSize, item.fontSize) * 0.4
    ) {
      current.push(item)
    } else {
      groups.push([item])
    }
  }
  return groups.flatMap((group) => {
    const items = [...group].sort((a, b) => a.x - b.x)
    const visible = items.filter((item) => item.text.trim() !== '')
    const first = visible[0]
    if (!first) return []
    const isBold = visible.every((item) => item.isBold)
    let text = ''
    let plain = ''
    let previous: PdfTextItem | null = null
    for (const item of items) {
      const gap = previous ? item.x - (previous.x + previous.width) : 0
      const needsSpace =
        previous !== null &&
        gap > item.fontSize * 0.2 &&
        !plain.endsWith(' ') &&
        !item.text.startsWith(' ')
      const piece = escapeText(item.text)
      const marked =
        !isBold && item.isBold && item.text.trim() !== '' ? `**${piece.trim()}**` : piece
      text += (needsSpace ? ' ' : '') + marked
      plain += (needsSpace ? ' ' : '') + item.text
      previous = item
    }
    const chars = (item: PdfTextItem) => item.text.trim().length
    const dominant = [...visible].sort((a, b) => chars(b) - chars(a))[0] ?? first
    return [
      {
        text: text
          .replace(/\*\*\s*\*\*/g, '')
          .replace(/\s+/g, ' ')
          .trim(),
        plain: plain.replace(/\s+/g, ' ').trim(),
        x: first.x,
        y: first.y,
        fontSize: round(dominant.fontSize),
        isBold,
        isMono: visible.filter((item) => item.isMono).length * 2 > visible.length,
        page: pageIndex,
      },
    ]
  })
}

// Lines repeated near the top or bottom of most pages are running headers and footers.
function dropRunningLines(pages: Line[][], layouts: readonly PdfPageLayout[]) {
  const isMargin = (line: Line) => {
    const height = layouts[line.page]?.height ?? 0
    return line.y > height * 0.9 || line.y < height * 0.1
  }
  const key = (line: Line) => line.plain.replace(/\d+/g, '#').toLowerCase()
  const seenOn = new Map<string, Set<number>>()
  for (const line of pages.flat()) {
    if (!isMargin(line)) continue
    const pagesWithKey = seenOn.get(key(line)) ?? new Set<number>()
    pagesWithKey.add(line.page)
    seenOn.set(key(line), pagesWithKey)
  }
  const threshold = Math.max(2, Math.ceil(pages.length * 0.5))
  return pages.map((lines) =>
    lines.filter((line) => {
      if (!isMargin(line)) return true
      if (PAGE_NUMBER.test(line.plain)) return false
      return (seenOn.get(key(line))?.size ?? 0) < threshold
    }),
  )
}

function headingLevels(lines: Line[]) {
  const weight = new Map<number, number>()
  for (const line of lines) {
    weight.set(line.fontSize, (weight.get(line.fontSize) ?? 0) + line.plain.length)
  }
  const body = [...weight.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 10
  const larger = [...weight.keys()].filter((size) => size >= body * 1.15).sort((a, b) => b - a)
  const levels = new Map(larger.slice(0, 3).map((size, index) => [size, index + 1]))
  const boldLevel = Math.min(levels.size + 1, 4)
  return (line: Line) => {
    if (line.isMono) return null
    const level = levels.get(line.fontSize)
    if (level !== undefined && line.plain.length <= 120) return level
    if (line.fontSize > body * 1.15) return levels.size > 0 ? 3 : null
    const looksLikeTitle = line.isBold && line.plain.length <= 80 && !/[.,;:]$/.test(line.plain)
    return looksLikeTitle && line.fontSize >= body ? boldLevel : null
  }
}

function elementsOf(lines: Line[], images: readonly PdfImage[]): Element[] {
  const elements: Element[] = [
    ...lines.map((line) => ({ kind: 'line' as const, line, top: line.y + line.fontSize * 0.8 })),
    ...images.map((image) => ({ kind: 'image' as const, image, top: image.y })),
  ]
  return elements.sort((a, b) => b.top - a.top)
}

// Body text starts at the page's left margin; lines indented well past it are list items
// whose bullets were drawn as shapes rather than text.
function leftMargin(lines: Line[]) {
  const weight = new Map<number, number>()
  let total = 0
  for (const line of lines) {
    const x = Math.round(line.x)
    weight.set(x, (weight.get(x) ?? 0) + line.plain.length)
    total += line.plain.length
  }
  // The leftmost x that holds a real share of the text; stray outdented lines don't count.
  const sorted = [...weight.entries()].sort((a, b) => a[0] - b[0])
  return sorted.find(([, chars]) => chars >= total * 0.15)?.[0] ?? sorted[0]?.[0] ?? 0
}

type LineContext = {
  previous: Line | null
  level: number | null
  margin: number
  writer: BlockWriter
}

type LineKind =
  'code' | 'heading' | 'bullet' | 'numbered' | 'continuation' | 'indented' | 'paragraph'

function kindOf(line: Line, { previous, level, margin, writer }: LineContext): LineKind {
  const isFarApart =
    previous !== null && previous.y - line.y > Math.max(previous.fontSize, line.fontSize) * 1.7
  const item = writer.currentItem
  if (line.isMono) return 'code'
  if (level !== null) return 'heading'
  if (BULLET.test(line.plain)) return 'bullet'
  if (NUMBERED.test(line.plain)) return 'numbered'
  if (item && !isFarApart && line.x > item.x + 2) return 'continuation'
  if (line.x < margin + line.fontSize * 1.5) return 'paragraph'
  const endsSentence = previous ? /[.!?:;]$/.test(previous.plain) : true
  const isSameIndent = item !== undefined && Math.abs(item.x - line.x) <= 2
  const continuesItem =
    isSameIndent && !isFarApart && !endsSentence && !/^[A-Z0-9]/.test(line.plain)
  return continuesItem ? 'continuation' : 'indented'
}

function writeLine(line: Line, context: LineContext) {
  const { previous, level, writer } = context
  const isFarApart =
    previous !== null && previous.y - line.y > Math.max(previous.fontSize, line.fontSize) * 1.7
  switch (kindOf(line, context)) {
    case 'code':
      writer.codeLine(line)
      break
    case 'heading': {
      const continues = previous !== null && !isFarApart && previous.fontSize === line.fontSize
      writer.heading(level ?? 2, line.text.replace(/\*\*/g, ''), continues)
      break
    }
    case 'bullet':
      writer.listItem({
        marker: '-',
        text: line.text.replace(/^(\\\*|[•◦▪▫‣∙●○■□–-])\s*/, ''),
        x: line.x,
      })
      break
    case 'numbered':
      writer.listItem({
        marker: '1.',
        text: line.text.replace(/^\\?\(?(\d{1,3}|[a-z])[.)]\s+/, ''),
        x: line.x,
      })
      break
    case 'continuation':
      writer.continueItem(line.text)
      break
    case 'indented':
      writer.listItem({ marker: '-', text: line.text, x: line.x })
      break
    case 'paragraph': {
      const endsSentence = previous ? /[.!?:;]$/.test(previous.plain) : true
      const changesStyle = previous !== null && line.fontSize !== previous.fontSize
      writer.paragraphLine(
        line,
        isFarApart || (endsSentence && changesStyle) || !writer.hasOpenParagraph,
      )
    }
  }
}

export function pdfLayoutToMarkdown(layouts: readonly PdfPageLayout[]): string {
  const pages = dropRunningLines(
    layouts.map((page, index) => buildLines(page, index)),
    layouts,
  )
  const levelOf = headingLevels(pages.flat())
  const writer = new BlockWriter()
  pages.forEach((lines, pageIndex) => {
    const margin = leftMargin(lines.filter((line) => levelOf(line) === null && !line.isMono))
    let previous: Line | null = null
    for (const element of elementsOf(lines, layouts[pageIndex]?.images ?? [])) {
      if (element.kind === 'image') {
        writer.image(element.image.ref)
        previous = null
        continue
      }
      writeLine(element.line, { previous, level: levelOf(element.line), margin, writer })
      previous = element.line
    }
    writer.pageBreak()
  })
  writer.flush()
  return `${writer.blocks.join('\n\n').trim()}\n`
}
