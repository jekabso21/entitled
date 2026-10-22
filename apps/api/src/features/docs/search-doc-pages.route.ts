import { docSearchQuerySchema, docSearchResultSchema } from '@entitled/contracts/docs'
import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { DomainError } from '#lib/domain-error.ts'
import { loadProductAccess } from '#lib/product-access.ts'
import { searchDocPages } from './search-doc-pages.ts'

const route = createRoute({
  method: 'get',
  path: '/products/{productId}/docs/search',
  tags: ['Docs'],
  summary: 'Full-text search over the documentation pages the caller can read',
  request: { params: z.object({ productId: z.uuid() }), query: docSearchQuerySchema },
  responses: {
    200: {
      description: 'Matching pages, best match first',
      content: { 'application/json': { schema: z.array(docSearchResultSchema) } },
    },
  },
})

export const searchDocPagesRoute = createRouter().openapi(route, async (c) => {
  const access = await loadProductAccess(db, requireActor(c))
  const { productId } = c.req.valid('param')
  const results = await searchDocPages(db, access, productId, c.req.valid('query').q)
  if (!results) throw new DomainError('not_found', 'Product not found')
  return c.json(results, 200)
})
