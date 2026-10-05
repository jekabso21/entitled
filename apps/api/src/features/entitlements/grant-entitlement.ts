import type { Entitlement, GrantEntitlementInput } from '@entitled/contracts/entitlements'
import {
  entitlementRevisions,
  entitlements,
  hardwareRevisions,
  organizations,
  products,
} from '@entitled/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'

// Granting again replaces the revision limits, so the call is idempotent.
export async function grantEntitlement(
  { tx }: TransactionScope,
  actor: Actor,
  input: GrantEntitlementInput,
): Promise<Entitlement> {
  const [account] = await tx
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.id, input.clientAccountId))
  if (!account) throw new DomainError('not_found', 'Client account not found')

  const [product] = await tx
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(eq(products.id, input.productId))
  if (!product) throw new DomainError('not_found', 'Product not found')

  const revisionIds = [...new Set(input.revisionIds)]
  if (revisionIds.length > 0) {
    const found = await tx
      .select({ id: hardwareRevisions.id })
      .from(hardwareRevisions)
      .where(
        and(
          eq(hardwareRevisions.productId, product.id),
          inArray(hardwareRevisions.id, revisionIds),
        ),
      )
    if (found.length !== revisionIds.length) {
      throw new DomainError('invalid_state', 'Every revision must belong to the product')
    }
  }

  const [entitlement] = await tx
    .insert(entitlements)
    .values({ clientAccountId: account.id, productId: product.id })
    .onConflictDoUpdate({
      target: [entitlements.clientAccountId, entitlements.productId],
      set: { updatedAt: new Date() },
    })
    .returning()
  if (!entitlement) throw new Error('Entitlement upsert returned no row')

  await tx
    .delete(entitlementRevisions)
    .where(eq(entitlementRevisions.entitlementId, entitlement.id))
  if (revisionIds.length > 0) {
    await tx
      .insert(entitlementRevisions)
      .values(revisionIds.map((revisionId) => ({ entitlementId: entitlement.id, revisionId })))
  }

  await recordAudit(tx, {
    actorUserId: actor.userId,
    action: 'entitlement.granted',
    subjectType: 'client_account',
    subjectId: account.id,
    metadata: { productId: product.id, revisionIds },
  })

  return {
    id: entitlement.id,
    clientAccountId: account.id,
    productId: product.id,
    productName: product.name,
    revisionIds,
    createdAt: entitlement.createdAt.toISOString(),
  }
}
