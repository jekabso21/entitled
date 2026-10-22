import { createHash } from 'node:crypto'
import { type RenderedDocument, renderDocument } from '@entitled/markdown'

const MAX_ENTRIES = 500
const cache = new Map<string, RenderedDocument>()
const EMPTY: RenderedDocument = { html: '', headings: [] }

// Pages and changelogs rarely change, so rendered output is memoised by content hash.
export async function renderDocumentCached(markdown: string) {
  if (markdown.trim() === '') return EMPTY
  const key = createHash('sha256').update(markdown).digest('hex')
  const hit = cache.get(key)
  if (hit !== undefined) return hit

  const rendered = await renderDocument(markdown)
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, rendered)
  return rendered
}

export async function renderMarkdownCached(markdown: string) {
  return (await renderDocumentCached(markdown)).html
}
