import { reorderDocPagesInputSchema } from '@entitled/contracts/docs'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { reorderDocPages } from './reorder-doc-pages.ts'

const route = createRoute({
  method: 'put',
  path: '/products/{productId}/docs/order',
  tags: ['Docs'],
  summary: 'Set the order and nesting of every documentation page of a product',
  request: {
    params: z.object({ productId: z.uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: reorderDocPagesInputSchema } },
    },
  },
  responses: { 204: { description: 'Order saved' } },
})

export const reorderDocPagesRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin', 'editor'])
  const { productId } = c.req.valid('param')
  const input = c.req.valid('json')
  await withTransaction((scope) => reorderDocPages(scope, actor, productId, input))
  return c.body(null, 204)
})
