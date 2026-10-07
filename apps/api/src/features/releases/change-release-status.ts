import { artifacts, releases } from '@entitled/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'

const transitions = {
  publish: { from: 'draft', to: 'published' },
  archive: { from: 'published', to: 'archived' },
} as const

export async function changeReleaseStatus(
  { tx }: TransactionScope,
  actor: Actor,
  releaseId: string,
  action: keyof typeof transitions,
) {
  const { from, to } = transitions[action]
  const [release] = await tx.select().from(releases).where(eq(releases.id, releaseId)).for('update')
  if (!release) throw new DomainError('not_found', 'Release not found')
  if (release.status !== from) {
    throw new DomainError('invalid_state', `Only ${from} releases can be ${to}`)
  }

  if (action === 'publish') {
    const unfinished = await tx
      .select({ id: artifacts.id })
      .from(artifacts)
      .where(
        and(
          eq(artifacts.releaseId, releaseId),
          inArray(artifacts.status, ['pending', 'processing']),
        ),
      )
    if (unfinished.length > 0) {
      throw new DomainError('invalid_state', 'Wait until every upload has finished processing')
    }
  }

  await tx
    .update(releases)
    .set({ status: to, ...(action === 'publish' ? { publishedAt: new Date() } : {}) })
    .where(eq(releases.id, releaseId))
  await recordAudit(tx, {
    actorUserId: actor.userId,
    action: `release.${to}`,
    subjectType: 'release',
    subjectId: releaseId,
    metadata: { version: release.version },
  })
}
