import type { Queryable } from '@entitled/db'
import { organizations, releaseClientAccounts } from '@entitled/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { DomainError } from '#lib/domain-error.ts'

export async function replaceReleaseClientAccounts(
  tx: Queryable,
  releaseId: string,
  clientAccountIds: readonly string[],
) {
  const uniqueIds = [...new Set(clientAccountIds)]
  if (uniqueIds.length > 0) {
    const found = await tx
      .select({ id: organizations.id })
      .from(organizations)
      .where(inArray(organizations.id, uniqueIds))
    if (found.length !== uniqueIds.length) {
      throw new DomainError('not_found', 'Client account not found')
    }
  }

  await tx.delete(releaseClientAccounts).where(eq(releaseClientAccounts.releaseId, releaseId))
  if (uniqueIds.length > 0) {
    await tx
      .insert(releaseClientAccounts)
      .values(uniqueIds.map((clientAccountId) => ({ releaseId, clientAccountId })))
  }
}
