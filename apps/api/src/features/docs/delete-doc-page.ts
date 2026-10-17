import { docPages } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'

export async function deleteDocPage({ tx }: TransactionScope, actor: Actor, pageId: string) {
  const [removed] = await tx.delete(docPages).where(eq(docPages.id, pageId)).returning()
  if (!removed) throw new DomainError('not_found', 'Page not found')
  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'doc_page.deleted',
    subjectType: 'doc_page',
    subjectId: pageId,
    metadata: { productId: removed.productId, title: removed.title },
  })
}
