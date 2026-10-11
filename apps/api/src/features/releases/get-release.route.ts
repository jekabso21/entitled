import { releaseSchema } from '@entitled/contracts/releases'
import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { DomainError } from '#lib/domain-error.ts'
import { loadProductAccess } from '#lib/product-access.ts'
import { findRelease } from './release-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/releases/{releaseId}',
  tags: ['Releases'],
  summary: 'One release with its artifacts',
  request: { params: z.object({ releaseId: z.uuid() }) },
  responses: {
    200: { description: 'Release', content: { 'application/json': { schema: releaseSchema } } },
  },
})

export const getReleaseRoute = createRouter().openapi(route, async (c) => {
  const access = await loadProductAccess(db, requireActor(c, { allowApiKey: true }))
  const release = await findRelease(db, access, c.req.valid('param').releaseId)
  if (!release) throw new DomainError('not_found', 'Release not found')
  return c.json(release, 200)
})
