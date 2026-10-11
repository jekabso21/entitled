import { createReleaseInputSchema, releaseSchema } from '@entitled/contracts/releases'
import { createRoute } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { createRelease } from './create-release.ts'
import { loadReleaseForVendor } from './release-response.ts'

const route = createRoute({
  method: 'post',
  path: '/releases',
  tags: ['Releases'],
  summary: 'Create a release; lands as a draft unless auto-publish is enabled',
  request: {
    body: { required: true, content: { 'application/json': { schema: createReleaseInputSchema } } },
  },
  responses: {
    201: {
      description: 'Created release',
      content: { 'application/json': { schema: releaseSchema } },
    },
  },
})

export const createReleaseRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin', 'editor'], { allowApiKey: true })
  const input = c.req.valid('json')
  const releaseId = await withTransaction((scope) => createRelease(scope, actor, input))
  return c.json(await loadReleaseForVendor(releaseId), 201)
})
