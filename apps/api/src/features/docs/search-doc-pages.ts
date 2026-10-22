import type { DocSearchResult } from '@entitled/contracts/docs'
import type { Queryable } from '@entitled/db'
import { docPages } from '@entitled/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import type { ProductAccess } from '#lib/product-access.ts'
import { listDocPages } from './doc-queries.ts'

const MAX_RESULTS = 20

// Same expression as doc_pages_search_idx, so the GIN index is used.
const searchVector = sql`(setweight(to_tsvector('simple', ${docPages.title}), 'A') || setweight(to_tsvector('simple', ${docPages.body}), 'B'))`

// Every word becomes a prefix match, so results appear while someone is still typing. Only
// letters and digits pass through, which keeps the tsquery syntax out of user hands.
export function toPrefixQuery(text: string) {
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  return words
    .slice(0, 8)
    .map((word) => `${word}:*`)
    .join(' & ')
}

// Search snippets come from raw Markdown; drop callout and tab markers, link targets and
// formatting characters.
export function cleanSnippet(snippet: string) {
  return snippet
    .replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gi, '')
    .replace(/\{\.tabset\}/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>|~$]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function searchDocPages(
  db: Queryable,
  access: ProductAccess,
  productId: string,
  text: string,
): Promise<DocSearchResult[] | null> {
  const visible = await listDocPages(db, access, productId)
  if (!visible) return null
  const prefixQuery = toPrefixQuery(text)
  if (!prefixQuery) return []

  const query = sql`to_tsquery('simple', ${prefixQuery})`
  const rows = await db
    .select({
      id: docPages.id,
      title: docPages.title,
      description: docPages.description,
      snippet: sql<string>`ts_headline('simple', ${docPages.body}, ${query}, 'StartSel=⟦, StopSel=⟧, MaxWords=24, MinWords=10, MaxFragments=1')`,
    })
    .from(docPages)
    .where(and(eq(docPages.productId, productId), sql`${searchVector} @@ ${query}`))
    .orderBy(desc(sql`ts_rank(${searchVector}, ${query})`))
    .limit(100)

  const visibleIds = new Set(visible.map((page) => page.id))
  return rows
    .filter((row) => visibleIds.has(row.id))
    .slice(0, MAX_RESULTS)
    .map((row) => ({ ...row, snippet: cleanSnippet(row.snippet) }))
}
