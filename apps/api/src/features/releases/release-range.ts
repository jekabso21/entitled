import type { Queryable } from '@entitled/db'
import { hardwareRevisions } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import { DomainError } from '#lib/domain-error.ts'

export async function assertValidRevisionRange(
  db: Queryable,
  productId: string,
  minRevisionId: string | null,
  maxRevisionId: string | null,
) {
  if (!minRevisionId && !maxRevisionId) return
  const revisions = await db
    .select({ id: hardwareRevisions.id, position: hardwareRevisions.position })
    .from(hardwareRevisions)
    .where(eq(hardwareRevisions.productId, productId))
  const positionOf = (id: string) => revisions.find((revision) => revision.id === id)?.position

  const min = minRevisionId ? positionOf(minRevisionId) : undefined
  const max = maxRevisionId ? positionOf(maxRevisionId) : undefined
  if ((minRevisionId && min === undefined) || (maxRevisionId && max === undefined)) {
    throw new DomainError('invalid_state', 'Revision range must use revisions of this product')
  }
  if (min !== undefined && max !== undefined && min > max) {
    throw new DomainError('invalid_state', 'The first revision must not come after the last')
  }
}
