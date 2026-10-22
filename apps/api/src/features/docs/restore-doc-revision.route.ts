import { docPageSchema } from '@entitled/contracts/docs'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { withTransaction } from '#lib/transaction.ts'
import { toDocPage } from './doc-queries.ts'
import { restoreDocRevision } from './restore-doc-revision.ts'

const route = createRoute({
  method: 'post',
  path: '/docs/{pageId}/revisions/{revisionId}/restore',
  tags: ['Docs'],
  summary: 'Bring back the title and text of a saved version (vendor admin or editor)',
  request: { params: z.object({ pageId: z.uuid(), revisionId: z.uuid() }) },
  responses: {
    200: {
      description: 'Restored page',
      content: { 'application/json': { schema: docPageSchema } },
    },
  },
})

export const restoreDocRevisionRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin', 'editor'])
  const { pageId, revisionId } = c.req.valid('param')
  const page = await withTransaction((scope) =>
    restoreDocRevision(scope, actor, pageId, revisionId),
  )
  return c.json(await toDocPage(db, page, { showAuthor: true }), 200)
})
