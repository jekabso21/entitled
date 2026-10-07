import type { CreateReleaseInput } from '@entitled/contracts/releases'
import { products, releases } from '@entitled/db/schema'
import { and, eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import { getInstallSettings } from '#lib/install-settings.ts'
import type { TransactionScope } from '#lib/transaction.ts'
import { assertValidRevisionRange } from './release-range.ts'

export async function createRelease(
  { tx }: TransactionScope,
  actor: Actor,
  input: CreateReleaseInput,
) {
  const [product] = await tx
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, input.productId))
  if (!product) throw new DomainError('not_found', 'Product not found')

  const [duplicate] = await tx
    .select({ id: releases.id })
    .from(releases)
    .where(and(eq(releases.productId, input.productId), eq(releases.version, input.version)))
  if (duplicate) throw new DomainError('conflict', `Version ${input.version} already exists`)

  await assertValidRevisionRange(tx, input.productId, input.minRevisionId, input.maxRevisionId)

  const { autoPublishReleases } = await getInstallSettings(tx)
  const [release] = await tx
    .insert(releases)
    .values({
      ...input,
      status: autoPublishReleases ? 'published' : 'draft',
      publishedAt: autoPublishReleases ? new Date() : null,
    })
    .returning({ id: releases.id, status: releases.status })
  if (!release) throw new Error('Release insert returned no row')

  await recordAudit(tx, {
    actorUserId: actor.userId,
    action: release.status === 'published' ? 'release.created_published' : 'release.created',
    subjectType: 'release',
    subjectId: release.id,
    metadata: { productId: input.productId, version: input.version },
  })
  return release.id
}
