import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { revokeApiKey } from './revoke-api-key.ts'

const route = createRoute({
  method: 'delete',
  path: '/api-keys/{apiKeyId}',
  tags: ['API keys'],
  summary: 'Revoke a CI API key (vendor admin)',
  request: { params: z.object({ apiKeyId: z.uuid() }) },
  responses: { 204: { description: 'Revoked' } },
})

export const revokeApiKeyRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin'])
  const { apiKeyId } = c.req.valid('param')
  await withTransaction((scope) => revokeApiKey(scope, actor, apiKeyId))
  return c.body(null, 204)
})
