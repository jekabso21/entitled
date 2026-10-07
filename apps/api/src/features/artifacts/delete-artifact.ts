import { artifacts, releases } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'

export async function deleteArtifact({ tx }: TransactionScope, actor: Actor, artifactId: string) {
  const [row] = await tx
    .select({ artifact: artifacts, releaseStatus: releases.status })
    .from(artifacts)
    .innerJoin(releases, eq(releases.id, artifacts.releaseId))
    .where(eq(artifacts.id, artifactId))
  if (!row) throw new DomainError('not_found', 'Artifact not found')
  if (row.releaseStatus !== 'draft') {
    throw new DomainError('invalid_state', 'Files of a published release cannot be removed')
  }

  await tx.delete(artifacts).where(eq(artifacts.id, artifactId))
  await recordAudit(tx, {
    actorUserId: actor.userId,
    action: 'artifact.deleted',
    subjectType: 'release',
    subjectId: row.artifact.releaseId,
    metadata: { artifactId, fileName: row.artifact.fileName },
  })
  return row.artifact.storageKey
}
