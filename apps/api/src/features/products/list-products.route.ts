import { productSchema } from '@entitled/contracts/products'
import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { loadProductAccess } from '#lib/product-access.ts'
import { listProducts } from './product-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/products',
  tags: ['Products'],
  summary: 'Products visible to the caller (all for vendor staff, entitled ones for clients)',
  responses: {
    200: {
      description: 'Products',
      content: { 'application/json': { schema: z.array(productSchema) } },
    },
  },
})

export const listProductsRoute = createRouter().openapi(route, async (c) => {
  const access = await loadProductAccess(db, requireActor(c))
  return c.json(await listProducts(db, access), 200)
})
