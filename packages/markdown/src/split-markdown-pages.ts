export type HeadingLevel = 1 | 2 | 3

export type SplitOptions = {
  // Headings at this level start a new page; null keeps everything on one page.
  pageLevel: HeadingLevel | null
  // Headings at this deeper level start a sub-page inside the current page.
  subPageLevel: HeadingLevel | null
  // Title for the single page, or for text that comes before the first page heading.
  fallbackTitle: string
}

export type SplitPage = { title: string; body: string; depth: number }

type Line = { text: string; level: number | null }

const FENCE = /^\s{0,3}(`{3,}|~{3,})/
const ATX_HEADING = /^\s{0,3}(#{1,6})(?:\s+(.*?))?(?:\s+#+)?\s*$/

function classifyLines(markdown: string): Line[] {
  let fence: string | null = null
  return markdown.split(/\r?\n/).map((text) => {
    const fenceMatch = FENCE.exec(text)
    if (fenceMatch?.[1]) {
      const marker = fenceMatch[1]
      if (fence === null) fence = marker
      else if (marker.startsWith(fence.charAt(0)) && marker.length >= fence.length) fence = null
      return { text, level: null }
    }
    if (fence !== null) return { text, level: null }
    const heading = ATX_HEADING.exec(text)
    return { text, level: heading?.[1] ? heading[1].length : null }
  })
}

function headingText(line: Line) {
  return (ATX_HEADING.exec(line.text)?.[2] ?? '').replace(/[*_`]/g, '').trim()
}

// Counts headings outside code blocks, per level 1–6.
export function countHeadings(markdown: string): number[] {
  const counts = [0, 0, 0, 0, 0, 0]
  for (const line of classifyLines(markdown)) {
    if (line.level !== null) counts[line.level - 1] = (counts[line.level - 1] ?? 0) + 1
  }
  return counts
}

// Picks the split most documents want: a page per top heading, sub-pages for the next level.
export function suggestSplit(markdown: string): Pick<SplitOptions, 'pageLevel' | 'subPageLevel'> {
  const counts = countHeadings(markdown)
  const levels = ([1, 2, 3] as const).filter((level) => (counts[level - 1] ?? 0) > 0)
  const [top, next] = levels
  if (top === undefined) return { pageLevel: null, subPageLevel: null }
  // A single H1 is usually the document title, so pages start one level lower.
  if (counts[top - 1] === 1 && next !== undefined) {
    const after = levels[2]
    return { pageLevel: next, subPageLevel: after ?? null }
  }
  return { pageLevel: top, subPageLevel: next ?? null }
}

// Shifts headings up so the shallowest one left in a page body becomes an H2.
function promoteHeadings(lines: Line[]) {
  const levels = lines.flatMap((line) => (line.level === null ? [] : [line.level]))
  const shift = levels.length ? Math.min(...levels) - 2 : 0
  if (shift <= 0) return lines.map((line) => line.text)
  return lines.map((line) =>
    line.level === null
      ? line.text
      : line.text.replace(/^(\s{0,3})#+/, `$1${'#'.repeat(line.level - shift)}`),
  )
}

function finishBody(lines: Line[]) {
  return promoteHeadings(lines).join('\n').trim()
}

export function splitMarkdownIntoPages(markdown: string, options: SplitOptions): SplitPage[] {
  const lines = classifyLines(markdown)
  const { pageLevel, subPageLevel } = options
  if (pageLevel === null) {
    const first = lines.find((line) => line.level !== null)
    const titleLine = first?.level === 1 ? first : undefined
    return [
      {
        title: titleLine ? headingText(titleLine) : options.fallbackTitle,
        body: finishBody(lines.filter((line) => line !== titleLine)),
        depth: 0,
      },
    ]
  }

  const pages: { title: string; lines: Line[]; depth: number }[] = []
  let preamble: Line[] = []
  let documentTitle: string | null = null
  for (const line of lines) {
    if (line.level !== null && line.level < pageLevel) {
      documentTitle ??= headingText(line)
      continue
    }
    if (line.level === pageLevel) {
      pages.push({ title: headingText(line), lines: [], depth: 0 })
    } else if (
      subPageLevel !== null &&
      line.level === subPageLevel &&
      subPageLevel > pageLevel &&
      pages.length > 0
    ) {
      pages.push({ title: headingText(line), lines: [], depth: 1 })
    } else if (pages.length === 0) {
      preamble.push(line)
    } else {
      pages.at(-1)?.lines.push(line)
    }
  }

  const result: SplitPage[] = pages.map((page) => ({
    title: page.title || options.fallbackTitle,
    body: finishBody(page.lines),
    depth: page.depth,
  }))
  preamble = preamble.filter((line) => line.text.trim() !== '')
  if (preamble.length > 0) {
    result.unshift({
      title: documentTitle ?? options.fallbackTitle,
      body: finishBody(preamble),
      depth: 0,
    })
  }
  return result.length > 0 ? result : [{ title: options.fallbackTitle, body: '', depth: 0 }]
}

// Nests the pages under one section page named after the document, reusing the intro page
// when the document starts with one.
export function groupUnderTitle(pages: readonly SplitPage[], title: string): SplitPage[] {
  const [first, ...rest] = pages
  if (!first) return []
  if (first.title === title && first.depth === 0) {
    return [first, ...rest.map((page) => ({ ...page, depth: page.depth + 1 }))]
  }
  return [
    { title, body: '', depth: 0 },
    ...pages.map((page) => ({ ...page, depth: page.depth + 1 })),
  ]
}
