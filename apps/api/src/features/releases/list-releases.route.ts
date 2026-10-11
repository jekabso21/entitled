import { releaseSchema } from '@entitled/contracts/releases'
import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { DomainError } from '#lib/domain-error.ts'
import { canSeeProduct, loadProductAccess } from '#lib/product-access.ts'
import { listReleasesForProduct } from './release-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/products/{productId}/releases',
  tags: ['Releases'],
  summary: 'Releases of a product visible to the caller, newest first',
  request: { params: z.object({ productId: z.uuid() }) },
  responses: {
    200: {
      description: 'Releases',
      content: { 'application/json': { schema: z.array(releaseSchema) } },
    },
  },
})

export const listReleasesRoute = createRouter().openapi(route, async (c) => {
  const { productId } = c.req.valid('param')
  const access = await loadProductAccess(db, requireActor(c, { allowApiKey: true }))
  if (!canSeeProduct(access, productId)) throw new DomainError('not_found', 'Product not found')
  return c.json(await listReleasesForProduct(db, access, productId), 200)
})
