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
  summary: 'List client accounts (vendor staff)',
  responses: {
    200: {
      description: 'Client accounts',
      content: { 'application/json': { schema: z.array(clientAccountSchema) } },
    },
  },
})

export const listClientAccountsRoute = createRouter().openapi(route, async (c) => {
  requireVendorRole(c, ['admin', 'editor', 'support'])
  return c.json(await listClientAccounts(db), 200)
})
