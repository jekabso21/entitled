import { createProductInputSchema, productSchema } from '@entitled/contracts/products'
import { createRoute } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { createProduct } from './create-product.ts'

const route = createRoute({
  method: 'post',
  path: '/products',
  tags: ['Products'],
  summary: 'Create a product (vendor admin or editor)',
  request: {
    body: { required: true, content: { 'application/json': { schema: createProductInputSchema } } },
  },
  responses: {
    201: {
      description: 'Created product',
      content: { 'application/json': { schema: productSchema } },
    },
  },
})

export const createProductRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin', 'editor'])
  const input = c.req.valid('json')
  return c.json(await withTransaction((scope) => createProduct(scope, actor, input)), 201)
})
