import { docAssetSchema } from '@entitled/contracts/docs'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { listDocAssets } from './doc-asset-usage.ts'

const route = createRoute({
  method: 'get',
  path: '/products/{productId}/doc-assets',
  tags: ['Docs'],
  summary: 'Files uploaded for a product’s docs and the pages using them (vendor staff)',
  request: { params: z.object({ productId: z.uuid() }) },
  responses: {
    200: {
      description: 'Files, newest first',
      content: { 'application/json': { schema: z.array(docAssetSchema) } },
    },
  },
})

export const listDocAssetsRoute = createRouter().openapi(route, async (c) => {
  requireVendorRole(c, ['admin', 'editor', 'support'])
  return c.json(await listDocAssets(db, c.req.valid('param').productId), 200)
})
