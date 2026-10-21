import { updateVendorStaffInputSchema } from '@entitled/contracts/accounts'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { updateVendorStaff } from './update-vendor-staff.ts'

const route = createRoute({
  method: 'patch',
  path: '/vendor-staff/{userId}',
  tags: ['Vendor staff'],
  summary: "Change a staff member's role, or remove vendor access with null (vendor admin)",
  request: {
    params: z.object({ userId: z.uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: updateVendorStaffInputSchema } },
    },
  },
  responses: { 204: { description: 'Updated' } },
})

export const updateVendorStaffRoute = createRouter().openapi(route, async (c) => {
  const actor = requireVendorRole(c, ['admin'])
  const { userId } = c.req.valid('param')
  const { vendorRole } = c.req.valid('json')
  await withTransaction((scope) => updateVendorStaff(scope, actor, userId, vendorRole))
  return c.body(null, 204)
})
