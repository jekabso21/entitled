import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { DomainError } from '#lib/domain-error.ts'
import { loadProductAccess } from '#lib/product-access.ts'
import { findDocPage } from './doc-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/docs/{pageId}/export',
  tags: ['Docs'],
  summary: 'Download a page as a Markdown file',
  request: { params: z.object({ pageId: z.uuid() }) },
  responses: { 200: { description: 'Markdown file' } },
})

export const exportDocPageRoute = createRouter().openapi(route, async (c) => {
  const access = await loadProductAccess(db, requireActor(c))
  const page = await findDocPage(db, access, c.req.valid('param').pageId)
  if (!page) throw new DomainError('not_found', 'Page not found')
  return c.body(page.body, 200, {
    'content-type': 'text/markdown; charset=utf-8',
    'content-disposition': `attachment; filename="${page.slug}.md"`,
  })
})
