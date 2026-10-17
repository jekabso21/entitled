import type { DocPage, DocPageSummary } from '@entitled/contracts/docs'
import type { Queryable } from '@entitled/db'
import { docPages } from '@entitled/db/schema'
import { and, asc, eq } from 'drizzle-orm'
import { renderMarkdownCached } from '#lib/markdown.ts'
import { canSeeProduct, type ProductAccess } from '#lib/product-access.ts'

type DocPageRow = typeof docPages.$inferSelect

function toSummary(row: DocPageRow): DocPageSummary {
  return {
    id: row.id,
    productId: row.productId,
    slug: row.slug,
    title: row.title,
    status: row.status,
    position: row.position,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function toDocPage(row: DocPageRow): Promise<DocPage> {
  return { ...toSummary(row), body: row.body, bodyHtml: await renderMarkdownCached(row.body) }
}

// Clients see published pages of products they are entitled to; vendor staff see everything.
export async function listDocPages(db: Queryable, access: ProductAccess, productId: string) {
  if (!canSeeProduct(access, productId)) return null
  const rows = await db
    .select()
    .from(docPages)
    .where(
      and(
        eq(docPages.productId, productId),
        access.kind === 'all' ? undefined : eq(docPages.status, 'published'),
      ),
    )
    .orderBy(asc(docPages.position), asc(docPages.title))
  return rows.map(toSummary)
}

export async function findDocPage(db: Queryable, access: ProductAccess, pageId: string) {
  const [row] = await db.select().from(docPages).where(eq(docPages.id, pageId))
  if (!row || !canSeeProduct(access, row.productId)) return null
  if (access.kind !== 'all' && row.status !== 'published') return null
  return row
}
