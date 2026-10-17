import { createDocPageInputSchema, docPageSchema } from '@entitled/contracts/docs'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { createDocPage } from './create-doc-page.ts'
import { toDocPage } from './doc-queries.ts'

const route = createRoute({
  method: 'post',
  path: '/products/{productId}/docs',
  tags: ['Docs'],
  summary: 'Create a draft documentation page (vendor admin or editor)',
  request: {
    params: z.object({ productId: z.uuid() }),
    body: { required: true, content: { 'application/json': { schema: createDocPageInputSchema } } },
  },
  responses: {
    201: {
      description: 'Created page',
      content: { 'application/json': { schema: docPageSchema } },
    },
  },
})

export const createDocPageRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin', 'editor'])
  const { productId } = c.req.valid('param')
  const input = c.req.valid('json')
  const page = await withTransaction((scope) => createDocPage(scope, actor, productId, input))
  return c.json(await toDocPage(page), 201)
})
