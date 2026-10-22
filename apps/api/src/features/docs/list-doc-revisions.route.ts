import { docPageRevisionSummarySchema } from '@entitled/contracts/docs'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { listDocRevisions } from './doc-revision-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/docs/{pageId}/revisions',
  tags: ['Docs'],
  summary: 'Saved versions of a page, newest first (vendor staff)',
  request: { params: z.object({ pageId: z.uuid() }) },
  responses: {
    200: {
      description: 'Versions',
      content: { 'application/json': { schema: z.array(docPageRevisionSummarySchema) } },
    },
  },
})

export const listDocRevisionsRoute = createRouter().openapi(route, async (c) => {
  requireVendorRole(c, ['admin', 'editor', 'support'])
  return c.json(await listDocRevisions(db, c.req.valid('param').pageId), 200)
})
