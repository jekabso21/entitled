import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { revokeEntitlement } from './revoke-entitlement.ts'

const route = createRoute({
  method: 'delete',
  path: '/entitlements/{entitlementId}',
  tags: ['Entitlements'],
  summary: 'Revoke an entitlement (vendor admin)',
  request: { params: z.object({ entitlementId: z.uuid() }) },
  responses: { 204: { description: 'Revoked' } },
})

export const revokeEntitlementRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin'])
  const { entitlementId } = c.req.valid('param')
  await withTransaction((scope) => revokeEntitlement(scope, actor, entitlementId))
  return c.body(null, 204)
})
