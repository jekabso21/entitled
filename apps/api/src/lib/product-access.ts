import type { Queryable } from '@entitled/db'
import { entitlementRevisions, entitlements, members } from '@entitled/db/schema'
import { eq, inArray } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'

// `null` revisions means every revision of that product is accessible.
export type ProductAccess =
  | { kind: 'all' }
  | {
      kind: 'scoped'
      products: ReadonlyMap<string, ReadonlySet<string> | null>
      clientAccountIds: ReadonlySet<string>
    }

// The single source of truth for what a client user may see. Every client-facing
// query for products, releases, artifacts and docs must filter through this.
export async function loadProductAccess(db: Queryable, actor: Actor): Promise<ProductAccess> {
  if (actor.vendorRole) return { kind: 'all' }

  const memberships = await db
    .select({ clientAccountId: members.organizationId })
    .from(members)
    .where(eq(members.userId, actor.userId))

  const granted = await db
    .select({ id: entitlements.id, productId: entitlements.productId })
    .from(entitlements)
    .innerJoin(members, eq(members.organizationId, entitlements.clientAccountId))
    .where(eq(members.userId, actor.userId))

  const limits =
    granted.length === 0
      ? []
      : await db
          .select()
          .from(entitlementRevisions)
          .where(
            inArray(
              entitlementRevisions.entitlementId,
              granted.map((row) => row.id),
            ),
          )

  const products = new Map<string, Set<string> | null>()
  for (const { id, productId } of granted) {
    const revisionIds = limits.filter((limit) => limit.entitlementId === id)
    const current = products.get(productId)
    // An unrestricted entitlement through any account wins over restricted ones.
    if (revisionIds.length === 0 || current === null) {
      products.set(productId, null)
      continue
    }
    const merged = current ?? new Set<string>()
    for (const limit of revisionIds) merged.add(limit.revisionId)
    products.set(productId, merged)
  }
  return {
    kind: 'scoped',
    products,
    clientAccountIds: new Set(memberships.map((row) => row.clientAccountId)),
  }
}

export function canSeeProduct(access: ProductAccess, productId: string) {
  return access.kind === 'all' || access.products.has(productId)
}

export function canSeeRevision(access: ProductAccess, productId: string, revisionId: string) {
  if (access.kind === 'all') return true
  const revisions = access.products.get(productId)
  if (revisions === undefined) return false
  return revisions === null || revisions.has(revisionId)
}
