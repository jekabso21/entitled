import { docPageSchema } from '@entitled/contracts/docs'
import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { DomainError } from '#lib/domain-error.ts'
import { loadProductAccess } from '#lib/product-access.ts'
import { findDocPage, toDocPage } from './doc-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/docs/{pageId}',
  tags: ['Docs'],
  summary: 'One documentation page with its rendered HTML',
  request: { params: z.object({ pageId: z.uuid() }) },
  responses: {
    200: { description: 'Page', content: { 'application/json': { schema: docPageSchema } } },
  },
})

export const getDocPageRoute = createRouter().openapi(route, async (c) => {
  const access = await loadProductAccess(db, requireActor(c))
  const page = await findDocPage(db, access, c.req.valid('param').pageId)
  if (!page) throw new DomainError('not_found', 'Page not found')
  return c.json(await toDocPage(db, page, { showAuthor: access.kind === 'all' }), 200)
})
