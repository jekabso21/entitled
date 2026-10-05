import { entitlementSchema } from '@entitled/contracts/entitlements'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { listEntitlementsForAccount } from './entitlement-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/client-accounts/{clientAccountId}/entitlements',
  tags: ['Entitlements'],
  summary: "A client account's entitlements (vendor staff)",
  request: { params: z.object({ clientAccountId: z.uuid() }) },
  responses: {
    200: {
      description: 'Entitlements',
      content: { 'application/json': { schema: z.array(entitlementSchema) } },
    },
  },
})

export const listEntitlementsRoute = createRouter().openapi(route, async (c) => {
  requireVendorRole(c, ['admin', 'editor', 'support'])
  const { clientAccountId } = c.req.valid('param')
  return c.json(await listEntitlementsForAccount(db, clientAccountId), 200)
})
