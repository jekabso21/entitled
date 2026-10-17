import { docPageSummarySchema } from '@entitled/contracts/docs'
import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { DomainError } from '#lib/domain-error.ts'
import { loadProductAccess } from '#lib/product-access.ts'
import { listDocPages } from './doc-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/products/{productId}/docs',
  tags: ['Docs'],
  summary: 'Documentation pages of a product (drafts only for vendor staff)',
  request: { params: z.object({ productId: z.uuid() }) },
  responses: {
    200: {
      description: 'Pages',
      content: { 'application/json': { schema: z.array(docPageSummarySchema) } },
    },
  },
})

export const listDocPagesRoute = createRouter().openapi(route, async (c) => {
  const access = await loadProductAccess(db, requireActor(c))
  const pages = await listDocPages(db, access, c.req.valid('param').productId)
  if (!pages) throw new DomainError('not_found', 'Product not found')
  return c.json(pages, 200)
})
