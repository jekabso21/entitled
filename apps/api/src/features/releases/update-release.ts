import type { UpdateReleaseInput } from '@entitled/contracts/releases'
import { releases } from '@entitled/db/schema'
import { and, eq, ne } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'
import { replaceReleaseClientAccounts } from './release-client-accounts.ts'
import { assertValidRevisionRange } from './release-range.ts'

// Text and who may download can change at any time; the version and hardware it targets are
// fixed once clients can see it.
const draftOnlyFields = ['version', 'minRevisionId', 'maxRevisionId'] as const

export async function updateRelease(
  { tx }: TransactionScope,
  actor: Actor,
  releaseId: string,
  input: UpdateReleaseInput,
) {
  const [release] = await tx.select().from(releases).where(eq(releases.id, releaseId)).for('update')
  if (!release) throw new DomainError('not_found', 'Release not found')

  const changesTarget = draftOnlyFields.some((field) => input[field] !== undefined)
  if (changesTarget && release.status !== 'draft') {
    throw new DomainError('invalid_state', 'Version and revision range can only change on drafts')
  }

  if (input.version && input.version !== release.version) {
    const [duplicate] = await tx
      .select({ id: releases.id })
      .from(releases)
      .where(
        and(
          eq(releases.productId, release.productId),
          eq(releases.version, input.version),
          ne(releases.id, release.id),
        ),
      )
    if (duplicate) throw new DomainError('conflict', `Version ${input.version} already exists`)
  }

  await assertValidRevisionRange(
    tx,
    release.productId,
    input.minRevisionId === undefined ? release.minRevisionId : input.minRevisionId,
    input.maxRevisionId === undefined ? release.maxRevisionId : input.maxRevisionId,
  )

  const { clientAccountIds, ...fields } = input
  if (clientAccountIds) await replaceReleaseClientAccounts(tx, releaseId, clientAccountIds)
  if (Object.keys(fields).length > 0) {
    await tx.update(releases).set(fields).where(eq(releases.id, releaseId))
  }
  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'release.updated',
    subjectType: 'release',
    subjectId: releaseId,
    metadata: { fields: Object.keys(input) },
  })
}
