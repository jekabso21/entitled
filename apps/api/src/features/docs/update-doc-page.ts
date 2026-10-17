import type { UpdateDocPageInput } from '@entitled/contracts/docs'
import { docPages } from '@entitled/db/schema'
import { and, eq, ne } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'

export async function updateDocPage(
  { tx }: TransactionScope,
  actor: Actor,
  pageId: string,
  input: UpdateDocPageInput,
) {
  const [page] = await tx.select().from(docPages).where(eq(docPages.id, pageId)).for('update')
  if (!page) throw new DomainError('not_found', 'Page not found')

  if (input.slug && input.slug !== page.slug) {
    const [clash] = await tx
      .select({ id: docPages.id })
      .from(docPages)
      .where(
        and(
          eq(docPages.productId, page.productId),
          eq(docPages.slug, input.slug),
          ne(docPages.id, pageId),
        ),
      )
    if (clash) throw new DomainError('conflict', 'Another page already uses this slug')
  }

  const [updated] = await tx
    .update(docPages)
    .set({ ...input, updatedByUserId: actor.userId })
    .where(eq(docPages.id, pageId))
    .returning()
  if (!updated) throw new Error('Doc page update returned no row')

  // Text edits are frequent; only publishing changes are worth an audit entry.
  if (input.status && input.status !== page.status) {
    await recordAudit(tx, {
      ...auditActor(actor),
      action: `doc_page.${input.status}`,
      subjectType: 'doc_page',
      subjectId: pageId,
      metadata: { title: updated.title },
    })
  }
  return updated
}
