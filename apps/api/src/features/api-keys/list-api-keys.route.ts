import { apiKeySchema } from '@entitled/contracts/api-keys'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { listApiKeys } from './api-key-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/api-keys',
  tags: ['API keys'],
  summary: 'CI API keys (vendor admin)',
  responses: {
    200: {
      description: 'API keys',
      content: { 'application/json': { schema: z.array(apiKeySchema) } },
    },
  },
})

export const listApiKeysRoute = createRouter().openapi(route, async (c) => {
  requireVendorRole(c, ['admin'])
  return c.json(await listApiKeys(db), 200)
})
