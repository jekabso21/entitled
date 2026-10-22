import { docPageSummarySchema, importDocPagesInputSchema } from '@entitled/contracts/docs'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { withTransaction } from '#lib/transaction.ts'
import { listDocPages } from './doc-queries.ts'
import { importDocPages } from './import-doc-pages.ts'

const route = createRoute({
  method: 'post',
  path: '/products/{productId}/docs/import-pages',
  tags: ['Docs'],
  summary: 'Create a tree of pages at once, e.g. from a converted Markdown or PDF document',
  request: {
    params: z.object({ productId: z.uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: importDocPagesInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Created pages, in reading order',
      content: { 'application/json': { schema: z.array(docPageSummarySchema) } },
    },
  },
})

export const importDocPagesRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin', 'editor'])
  const { productId } = c.req.valid('param')
  const input = c.req.valid('json')
  const created = await withTransaction((scope) => importDocPages(scope, actor, productId, input))
  const createdIds = new Set(created.map((page) => page.id))
  const pages = (await listDocPages(db, { kind: 'all' }, productId)) ?? []
  return c.json(
    pages.filter((page) => createdIds.has(page.id)),
    201,
  )
})
