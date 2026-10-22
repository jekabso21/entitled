import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { deleteStoredObject } from '#lib/object-storage.ts'
import { withTransaction } from '#lib/transaction.ts'
import { deleteDocAssets } from './delete-doc-assets.ts'

const route = createRoute({
  method: 'post',
  path: '/products/{productId}/doc-assets/delete',
  tags: ['Docs'],
  summary: 'Delete files no page uses: the listed ones, or all unused (vendor admin or editor)',
  request: {
    params: z.object({ productId: z.uuid() }),
    body: {
      required: true,
      content: {
        'application/json': {
          schema: z.strictObject({ assetIds: z.array(z.uuid()).min(1).max(500).nullable() }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'How many files were deleted',
      content: { 'application/json': { schema: z.object({ deleted: z.number().int() }) } },
    },
  },
})

export const deleteDocAssetsRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin', 'editor'])
  const { productId } = c.req.valid('param')
  const { assetIds } = c.req.valid('json')
  const keys = await withTransaction((scope) => deleteDocAssets(scope, actor, productId, assetIds))
  await Promise.all(keys.map((key) => deleteStoredObject(key)))
  return c.json({ deleted: keys.length }, 200)
})
