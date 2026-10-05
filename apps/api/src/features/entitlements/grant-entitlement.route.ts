import { entitlementSchema, grantEntitlementInputSchema } from '@entitled/contracts/entitlements'
import { createRoute } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { grantEntitlement } from './grant-entitlement.ts'

const route = createRoute({
  method: 'post',
  path: '/entitlements',
  tags: ['Entitlements'],
  summary: 'Grant a client account access to a product, optionally limited to revisions',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: grantEntitlementInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Entitlement',
      content: { 'application/json': { schema: entitlementSchema } },
    },
  },
})

export const grantEntitlementRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin'])
  const input = c.req.valid('json')
  return c.json(await withTransaction((scope) => grantEntitlement(scope, actor, input)), 200)
})
