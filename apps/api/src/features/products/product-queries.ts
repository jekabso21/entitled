import type { Product } from '@entitled/contracts/products'
import type { Queryable } from '@entitled/db'
import { canSeeRevision, type ProductAccess } from '#lib/product-access.ts'

async function queryProducts(db: Queryable, ids: string[] | null) {
  return db.query.products.findMany({
    where: ids ? { id: { in: ids } } : {},
    orderBy: { name: 'asc' },
    with: { revisions: { orderBy: { position: 'asc' } } },
  })
}

type ProductRow = Awaited<ReturnType<typeof queryProducts>>[number]

function toProduct(row: ProductRow, access: ProductAccess): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    revisions: row.revisions
      .filter((revision) => canSeeRevision(access, row.id, revision.id))
      .map(({ id, code, name, position }) => ({ id, code, name, position })),
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listProducts(db: Queryable, access: ProductAccess) {
  const ids = access.kind === 'all' ? null : [...access.products.keys()]
  if (ids?.length === 0) return []
  const rows = await queryProducts(db, ids)
  return rows.map((row) => toProduct(row, access))
}

export async function findProduct(db: Queryable, access: ProductAccess, productId: string) {
  if (access.kind === 'scoped' && !access.products.has(productId)) return null
  const [row] = await queryProducts(db, [productId])
  return row ? toProduct(row, access) : null
}
