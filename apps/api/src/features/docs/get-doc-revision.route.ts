import { docPageRevisionSchema } from '@entitled/contracts/docs'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { DomainError } from '#lib/domain-error.ts'
import { findDocRevision } from './doc-revision-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/docs/{pageId}/revisions/{revisionId}',
  tags: ['Docs'],
  summary: 'One saved version of a page with its Markdown (vendor staff)',
  request: { params: z.object({ pageId: z.uuid(), revisionId: z.uuid() }) },
  responses: {
    200: {
      description: 'Version',
      content: { 'application/json': { schema: docPageRevisionSchema } },
    },
  },
})

export const getDocRevisionRoute = createRouter().openapi(route, async (c) => {
  requireVendorRole(c, ['admin', 'editor', 'support'])
  const { pageId, revisionId } = c.req.valid('param')
  const revision = await findDocRevision(db, pageId, revisionId)
  if (!revision) throw new DomainError('not_found', 'Version not found')
  return c.json(revision, 200)
})
