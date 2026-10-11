import { productSchema } from '@entitled/contracts/products'
import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { DomainError } from '#lib/domain-error.ts'
import { loadProductAccess } from '#lib/product-access.ts'
import { findProduct } from './product-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/products/{productId}',
  tags: ['Products'],
  summary: 'One product with the revisions visible to the caller',
  request: { params: z.object({ productId: z.uuid() }) },
  responses: {
    200: { description: 'Product', content: { 'application/json': { schema: productSchema } } },
  },
})

export const getProductRoute = createRouter().openapi(route, async (c) => {
  const access = await loadProductAccess(db, requireActor(c, { allowApiKey: true }))
  const product = await findProduct(db, access, c.req.valid('param').productId)
  // Not-entitled and missing look identical, so ids cannot be probed.
  if (!product) throw new DomainError('not_found', 'Product not found')
  return c.json(product, 200)
})
