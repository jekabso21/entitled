import { createApiKeyInputSchema, createdApiKeySchema } from '@entitled/contracts/api-keys'
import { createRoute } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { createApiKey } from './create-api-key.ts'

const route = createRoute({
  method: 'post',
  path: '/api-keys',
  tags: ['API keys'],
  summary: 'Create a CI API key scoped to releases; the key is shown only in this response',
  request: {
    body: { required: true, content: { 'application/json': { schema: createApiKeyInputSchema } } },
  },
  responses: {
    201: {
      description: 'Created key',
      content: { 'application/json': { schema: createdApiKeySchema } },
    },
  },
})

export const createApiKeyRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin'])
  return c.json(await createApiKey(actor, c.req.valid('json')), 201)
})
