import type { Entitlement } from '@entitled/contracts/entitlements'
import type { Queryable } from '@entitled/db'
import { entitlementRevisions, entitlements, products } from '@entitled/db/schema'
import { asc, eq, inArray } from 'drizzle-orm'

export async function listEntitlementsForAccount(
  db: Queryable,
  clientAccountId: string,
): Promise<Entitlement[]> {
  const rows = await db
    .select({
      id: entitlements.id,
      clientAccountId: entitlements.clientAccountId,
      productId: entitlements.productId,
      productName: products.name,
      createdAt: entitlements.createdAt,
    })
    .from(entitlements)
    .innerJoin(products, eq(products.id, entitlements.productId))
    .where(eq(entitlements.clientAccountId, clientAccountId))
    .orderBy(asc(products.name))
  if (rows.length === 0) return []

  const limits = await db
    .select()
    .from(entitlementRevisions)
    .where(
      inArray(
        entitlementRevisions.entitlementId,
        rows.map((row) => row.id),
      ),
    )

  return rows.map((row) => ({
    ...row,
    revisionIds: limits
      .filter((limit) => limit.entitlementId === row.id)
      .map((limit) => limit.revisionId),
    createdAt: row.createdAt.toISOString(),
  }))
}
