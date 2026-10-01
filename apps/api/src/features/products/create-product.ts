import type { CreateProductInput, Product } from '@entitled/contracts/products'
import { products } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'

export async function createProduct(
  { tx }: TransactionScope,
  actor: Actor,
  input: CreateProductInput,
): Promise<Product> {
  const [existing] = await tx
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, input.slug))
  if (existing) throw new DomainError('conflict', 'A product with this slug exists')

  const [product] = await tx.insert(products).values(input).returning()
  if (!product) throw new Error('Product insert returned no row')

  await recordAudit(tx, {
    actorUserId: actor.userId,
    action: 'product.created',
    subjectType: 'product',
    subjectId: product.id,
    metadata: { name: product.name, slug: product.slug },
  })

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    revisions: [],
    createdAt: product.createdAt.toISOString(),
  }
}
