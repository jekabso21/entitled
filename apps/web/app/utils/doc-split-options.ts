import { countHeadings } from '@entitled/markdown/split-markdown-pages'

// Ways to split an imported document, from the heading levels it actually uses. Sub-page
// options appear only when the tree has room for another level.
export function docSplitOptions(markdown: string, roomForLevels: number) {
  const counts = countHeadings(markdown)
  const items = [{ label: 'Keep it as one page', value: 'none' }]
  const levels = ([1, 2, 3] as const).filter((level) => (counts[level - 1] ?? 0) > 0)
  for (const [index, level] of levels.entries()) {
    const count = counts[level - 1] ?? 0
    items.push({
      label: `A page for each heading ${String(level)} (${String(count)})`,
      value: `${String(level)}`,
    })
    const next = levels[index + 1]
    if (next !== undefined && roomForLevels > 1) {
      items.push({
        label: `A page for each heading ${String(level)}, sub-pages for heading ${String(next)}`,
        value: `${String(level)}-${String(next)}`,
      })
    }
  }
  return items
}
