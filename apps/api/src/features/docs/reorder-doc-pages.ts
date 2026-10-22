import type { ReorderDocPagesInput } from '@entitled/contracts/docs'
import { docPages } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'
import { assertValidTree } from './doc-page-tree.ts'

export async function reorderDocPages(
  { tx }: TransactionScope,
  actor: Actor,
  productId: string,
  input: ReorderDocPagesInput,
) {
  const existing = await tx
    .select({ id: docPages.id })
    .from(docPages)
    .where(eq(docPages.productId, productId))
    .for('update')
  const existingIds = new Set(existing.map((page) => page.id))
  const sentIds = new Set(input.pages.map((page) => page.id))
  // The client sends the whole tree, so a page added or removed meanwhile is a stale view.
  if (sentIds.size !== input.pages.length || sentIds.size !== existingIds.size) {
    throw new DomainError('conflict', 'The page list changed, reload and try again')
  }
  if ([...sentIds].some((id) => !existingIds.has(id))) {
    throw new DomainError('conflict', 'The page list changed, reload and try again')
  }
  assertValidTree(input.pages)

  const nextPosition = new Map<string | null, number>()
  for (const page of input.pages) {
    const position = nextPosition.get(page.parentId) ?? 0
    nextPosition.set(page.parentId, position + 1)
    await tx
      .update(docPages)
      .set({ parentId: page.parentId, position })
      .where(eq(docPages.id, page.id))
  }

  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'doc_pages.reordered',
    subjectType: 'product',
    subjectId: productId,
    metadata: { pages: input.pages.length },
  })
}
