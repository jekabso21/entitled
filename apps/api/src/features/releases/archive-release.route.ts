import { releaseSchema } from '@entitled/contracts/releases'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { changeReleaseStatus } from './change-release-status.ts'
import { loadReleaseForVendor } from './release-response.ts'

const route = createRoute({
  method: 'post',
  path: '/releases/{releaseId}/archive',
  tags: ['Releases'],
  summary: 'Archive a published release so clients no longer see it',
  request: { params: z.object({ releaseId: z.uuid() }) },
  responses: {
    200: {
      description: 'Updated release',
      content: { 'application/json': { schema: releaseSchema } },
    },
  },
})

export const archiveReleaseRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin', 'editor'])
  const { releaseId } = c.req.valid('param')
  await withTransaction((scope) => changeReleaseStatus(scope, actor, releaseId, 'archive'))
  return c.json(await loadReleaseForVendor(releaseId), 200)
})
