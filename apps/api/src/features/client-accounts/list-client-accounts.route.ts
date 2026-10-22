import { clientAccountSchema } from '@entitled/contracts/client-accounts'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { listClientAccounts } from './client-account-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/client-accounts',
  tags: ['Client accounts'],
  summary: 'List client accounts (vendor staff), optionally only those entitled to a product',
  request: { query: z.object({ productId: z.uuid().optional() }) },
  responses: {
    200: {
      description: 'Client accounts',
      content: { 'application/json': { schema: z.array(clientAccountSchema) } },
    },
  },
})

export const listClientAccountsRoute = createRouter().openapi(route, async (c) => {
  requireVendorRole(c, ['admin', 'editor', 'support'])
  const { productId } = c.req.valid('query')
  return c.json(await listClientAccounts(db, { productId }), 200)
})
