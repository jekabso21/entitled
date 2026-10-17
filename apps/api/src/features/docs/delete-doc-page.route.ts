import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { deleteDocPage } from './delete-doc-page.ts'

const route = createRoute({
  method: 'delete',
  path: '/docs/{pageId}',
  tags: ['Docs'],
  summary: 'Delete a page (vendor admin or editor)',
  request: { params: z.object({ pageId: z.uuid() }) },
  responses: { 204: { description: 'Deleted' } },
})

export const deleteDocPageRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin', 'editor'])
  await withTransaction((scope) => deleteDocPage(scope, actor, c.req.valid('param').pageId))
  return c.body(null, 204)
})
