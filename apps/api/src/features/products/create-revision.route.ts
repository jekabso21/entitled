import { createRevisionInputSchema, hardwareRevisionSchema } from '@entitled/contracts/products'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { createRevision } from './create-revision.ts'

const route = createRoute({
  method: 'post',
  path: '/products/{productId}/revisions',
  tags: ['Products'],
  summary: 'Add the next hardware revision to a product (vendor admin or editor)',
  request: {
    params: z.object({ productId: z.uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: createRevisionInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Created revision',
      content: { 'application/json': { schema: hardwareRevisionSchema } },
    },
  },
})

export const createRevisionRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin', 'editor'])
  const { productId } = c.req.valid('param')
  const input = c.req.valid('json')
  return c.json(
    await withTransaction((scope) => createRevision(scope, actor, productId, input)),
    201,
  )
})
