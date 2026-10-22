import { docPages } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'
import { findDocRevision } from './doc-revision-queries.ts'
import { recordDocRevisions } from './record-doc-revision.ts'

// Restoring writes the old text as a new version, so the restore itself can be undone.
export async function restoreDocRevision(
  { tx }: TransactionScope,
  actor: Actor,
  pageId: string,
  revisionId: string,
) {
  const revision = await findDocRevision(tx, pageId, revisionId)
  if (!revision) throw new DomainError('not_found', 'Version not found')

  const [page] = await tx
    .update(docPages)
    .set({ title: revision.title, body: revision.body, updatedByUserId: actor.userId })
    .where(eq(docPages.id, pageId))
    .returning()
  if (!page) throw new DomainError('not_found', 'Page not found')

  await recordDocRevisions(tx, [page], actor.userId)
  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'doc_page.restored',
    subjectType: 'doc_page',
    subjectId: pageId,
    metadata: { title: page.title, revisionId, revisionCreatedAt: revision.createdAt },
  })
  return page
}
