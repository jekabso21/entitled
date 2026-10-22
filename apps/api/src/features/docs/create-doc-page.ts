import type { CreateDocPageInput } from '@entitled/contracts/docs'
import { docPages, products } from '@entitled/db/schema'
import { eq, max } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'
import { assertValidTree } from './doc-page-tree.ts'
import { recordDocRevisions } from './record-doc-revision.ts'
import { slugify, uniqueDocSlug } from './unique-doc-slug.ts'

export async function createDocPage(
  { tx }: TransactionScope,
  actor: Actor,
  productId: string,
  input: CreateDocPageInput,
) {
  const [product] = await tx
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
  if (!product) throw new DomainError('not_found', 'Product not found')

  const parentId = input.parentId ?? null
  if (parentId) {
    const siblings = await tx
      .select({ id: docPages.id, parentId: docPages.parentId })
      .from(docPages)
      .where(eq(docPages.productId, productId))
    if (!siblings.some((page) => page.id === parentId)) {
      throw new DomainError('not_found', 'Parent page not found')
    }
    assertValidTree([...siblings, { id: 'new', parentId }])
  }

  const slug = await uniqueDocSlug(tx, productId, input.slug ?? slugify(input.title))
  const [last] = await tx
    .select({ position: max(docPages.position) })
    .from(docPages)
    .where(eq(docPages.productId, productId))

  const [page] = await tx
    .insert(docPages)
    .values({
      productId,
      parentId,
      slug,
      title: input.title,
      description: input.description,
      body: input.body,
      position: (last?.position ?? -1) + 1,
      updatedByUserId: actor.userId,
    })
    .returning()
  if (!page) throw new Error('Doc page insert returned no row')
  await recordDocRevisions(tx, [page], actor.userId)

  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'doc_page.created',
    subjectType: 'doc_page',
    subjectId: page.id,
    metadata: { productId, title: page.title },
  })
  return page
}
