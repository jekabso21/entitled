import type { ImportDocPagesInput } from '@entitled/contracts/docs'
import { docPages, products } from '@entitled/db/schema'
import { eq, max } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'
import { recordDocRevisions } from './record-doc-revision.ts'
import { assertValidTree } from './doc-page-tree.ts'
import { slugify, uniqueDocSlug } from './unique-doc-slug.ts'

// Turns the flat, depth-annotated list into parent links: each page hangs under the closest
// earlier page one level up.
function planTree(input: ImportDocPagesInput) {
  const ancestors: string[] = []
  return input.pages.map((page, index) => {
    if (page.depth > ancestors.length) {
      throw new DomainError('invalid_state', `Page "${page.title}" skips a nesting level`)
    }
    ancestors.length = page.depth
    const key = `import-${String(index)}`
    const parentKey = ancestors.at(-1) ?? input.parentId
    ancestors.push(key)
    return { ...page, key, parentKey }
  })
}

export async function importDocPages(
  { tx }: TransactionScope,
  actor: Actor,
  productId: string,
  input: ImportDocPagesInput,
) {
  const [product] = await tx
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
  if (!product) throw new DomainError('not_found', 'Product not found')

  const existing = await tx
    .select({ id: docPages.id, parentId: docPages.parentId })
    .from(docPages)
    .where(eq(docPages.productId, productId))
  if (input.parentId && !existing.some((page) => page.id === input.parentId)) {
    throw new DomainError('not_found', 'Parent page not found')
  }
  const plan = planTree(input)
  assertValidTree([
    ...existing,
    ...plan.map((page) => ({ id: page.key, parentId: page.parentKey })),
  ])

  const [last] = await tx
    .select({ position: max(docPages.position) })
    .from(docPages)
    .where(eq(docPages.productId, productId))
  let position = (last?.position ?? -1) + 1
  const idByKey = new Map<string, string>()
  const created = []
  for (const page of plan) {
    const parentId =
      page.parentKey === null ? null : (idByKey.get(page.parentKey) ?? page.parentKey)
    const [row] = await tx
      .insert(docPages)
      .values({
        productId,
        parentId,
        slug: await uniqueDocSlug(tx, productId, slugify(page.title)),
        title: page.title,
        body: page.body,
        status: input.status,
        position,
        updatedByUserId: actor.userId,
      })
      .returning()
    if (!row) throw new Error('Doc page insert returned no row')
    idByKey.set(page.key, row.id)
    created.push(row)
    position += 1
  }

  await recordDocRevisions(tx, created, actor.userId)
  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'doc_pages.imported',
    subjectType: 'product',
    subjectId: productId,
    metadata: { pages: created.length, status: input.status },
  })
  return created
}
