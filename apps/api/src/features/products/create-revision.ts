import type { CreateRevisionInput, HardwareRevision } from '@entitled/contracts/products'
import { hardwareRevisions, products } from '@entitled/db/schema'
import { and, eq, max } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'

export async function createRevision(
  { tx }: TransactionScope,
  actor: Actor,
  productId: string,
  input: CreateRevisionInput,
): Promise<HardwareRevision> {
  // Locking the product row serialises concurrent revision inserts, so positions stay unique.
  const [product] = await tx
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .for('update')
  if (!product) throw new DomainError('not_found', 'Product not found')

  const [duplicate] = await tx
    .select({ id: hardwareRevisions.id })
    .from(hardwareRevisions)
    .where(and(eq(hardwareRevisions.productId, productId), eq(hardwareRevisions.code, input.code)))
  if (duplicate) throw new DomainError('conflict', `Revision ${input.code} already exists`)

  const [last] = await tx
    .select({ position: max(hardwareRevisions.position) })
    .from(hardwareRevisions)
    .where(eq(hardwareRevisions.productId, productId))
  const position = (last?.position ?? 0) + 1

  const [revision] = await tx
    .insert(hardwareRevisions)
    .values({ productId, code: input.code, name: input.name, position })
    .returning()
  if (!revision) throw new Error('Revision insert returned no row')

  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'hardware_revision.created',
    subjectType: 'product',
    subjectId: productId,
    metadata: { code: revision.code },
  })

  return { id: revision.id, code: revision.code, name: revision.name, position: revision.position }
}
