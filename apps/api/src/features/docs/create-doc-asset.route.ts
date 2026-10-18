import { createDocAssetInputSchema, docAssetUploadSchema } from '@entitled/contracts/docs'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { createDocAsset } from './create-doc-asset.ts'

const route = createRoute({
  method: 'post',
  path: '/products/{productId}/doc-assets',
  tags: ['Docs'],
  summary: 'Get an upload URL for an image or video to embed in docs',
  request: {
    params: z.object({ productId: z.uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: createDocAssetInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Upload URL',
      content: { 'application/json': { schema: docAssetUploadSchema } },
    },
  },
})

export const createDocAssetRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin', 'editor'])
  const { productId } = c.req.valid('param')
  return c.json(await createDocAsset(db, actor, productId, c.req.valid('json')), 201)
})
