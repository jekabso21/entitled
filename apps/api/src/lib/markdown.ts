import { createHash } from 'node:crypto'
import { renderMarkdown } from '@entitled/markdown'

const MAX_ENTRIES = 500
const cache = new Map<string, string>()

// Changelogs rarely change, so rendered HTML is memoised by content hash.
export async function renderMarkdownCached(markdown: string) {
  if (markdown.trim() === '') return ''
  const key = createHash('sha256').update(markdown).digest('hex')
  const hit = cache.get(key)
  if (hit !== undefined) return hit

  const html = await renderMarkdown(markdown)
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, html)
  return html
}
