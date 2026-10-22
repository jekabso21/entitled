import type { DocPage, DocPageSummary } from '@entitled/contracts/docs'
import type { Queryable } from '@entitled/db'
import { docPages, users } from '@entitled/db/schema'
import { asc, eq } from 'drizzle-orm'
import { renderDocumentCached } from '#lib/markdown.ts'
import { canSeeProduct, type ProductAccess } from '#lib/product-access.ts'
import { visibleToClients } from './doc-page-tree.ts'

type DocPageRow = typeof docPages.$inferSelect

function toSummary(row: DocPageRow): DocPageSummary {
  return {
    id: row.id,
    productId: row.productId,
    parentId: row.parentId,
    slug: row.slug,
    title: row.title,
    description: row.description,
    status: row.status,
    position: row.position,
    updatedAt: row.updatedAt.toISOString(),
  }
}

async function authorName(db: Queryable, userId: string | null) {
  if (!userId) return null
  const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId))
  return user?.name ?? null
}

export async function toDocPage(
  db: Queryable,
  row: DocPageRow,
  { showAuthor }: { showAuthor: boolean },
): Promise<DocPage> {
  const { html, headings } = await renderDocumentCached(row.body)
  return {
    ...toSummary(row),
    body: row.body,
    bodyHtml: html,
    headings,
    updatedByName: showAuthor ? await authorName(db, row.updatedByUserId) : null,
  }
}

async function productPages(db: Queryable, access: ProductAccess, productId: string) {
  const rows = await db
    .select()
    .from(docPages)
    .where(eq(docPages.productId, productId))
    .orderBy(asc(docPages.position), asc(docPages.title))
  return access.kind === 'all' ? rows : visibleToClients(rows)
}

// Clients see published pages (under published parents) of products they are entitled to;
// vendor staff see everything.
export async function listDocPages(db: Queryable, access: ProductAccess, productId: string) {
  if (!canSeeProduct(access, productId)) return null
  return (await productPages(db, access, productId)).map(toSummary)
}

export async function findDocPage(db: Queryable, access: ProductAccess, pageId: string) {
  const [row] = await db
    .select({ productId: docPages.productId })
    .from(docPages)
    .where(eq(docPages.id, pageId))
  if (!row || !canSeeProduct(access, row.productId)) return null
  const pages = await productPages(db, access, row.productId)
  return pages.find((page) => page.id === pageId) ?? null
}
