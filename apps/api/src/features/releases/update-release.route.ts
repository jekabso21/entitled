import { releaseSchema, updateReleaseInputSchema } from '@entitled/contracts/releases'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { loadReleaseForVendor } from './release-response.ts'
import { updateRelease } from './update-release.ts'

const route = createRoute({
  method: 'patch',
  path: '/releases/{releaseId}',
  tags: ['Releases'],
  summary: 'Edit a release; version and revision range only while it is a draft',
  request: {
    params: z.object({ releaseId: z.uuid() }),
    body: { required: true, content: { 'application/json': { schema: updateReleaseInputSchema } } },
  },
  responses: {
    200: {
      description: 'Updated release',
      content: { 'application/json': { schema: releaseSchema } },
    },
  },
})

export const updateReleaseRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin', 'editor'], { allowApiKey: true })
  const { releaseId } = c.req.valid('param')
  const input = c.req.valid('json')
  await withTransaction((scope) => updateRelease(scope, actor, releaseId, input))
  return c.json(await loadReleaseForVendor(releaseId), 200)
})
