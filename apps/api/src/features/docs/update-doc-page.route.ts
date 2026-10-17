import { docPageSchema, updateDocPageInputSchema } from '@entitled/contracts/docs'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { toDocPage } from './doc-queries.ts'
import { updateDocPage } from './update-doc-page.ts'

const route = createRoute({
  method: 'patch',
  path: '/docs/{pageId}',
  tags: ['Docs'],
  summary: 'Edit, publish or reorder a page (vendor admin or editor)',
  request: {
    params: z.object({ pageId: z.uuid() }),
    body: { required: true, content: { 'application/json': { schema: updateDocPageInputSchema } } },
  },
  responses: {
    200: {
      description: 'Updated page',
      content: { 'application/json': { schema: docPageSchema } },
    },
  },
})

export const updateDocPageRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin', 'editor'])
  const { pageId } = c.req.valid('param')
  const input = c.req.valid('json')
  const page = await withTransaction((scope) => updateDocPage(scope, actor, pageId, input))
  return c.json(await toDocPage(page), 200)
})
