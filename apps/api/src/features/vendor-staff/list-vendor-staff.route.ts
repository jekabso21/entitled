import { vendorStaffMemberSchema } from '@entitled/contracts/accounts'
import { users } from '@entitled/db/schema'
import { createRoute, z } from '@hono/zod-openapi'
import { asc, isNotNull } from 'drizzle-orm'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'

const route = createRoute({
  method: 'get',
  path: '/vendor-staff',
  tags: ['Vendor staff'],
  summary: 'Everyone with vendor access (vendor admin)',
  responses: {
    200: {
      description: 'Vendor staff',
      content: { 'application/json': { schema: z.array(vendorStaffMemberSchema) } },
    },
  },
})

export const listVendorStaffRoute = createRouter().openapi(route, async (c) => {
  requireVendorRole(c, ['admin'])
  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      vendorRole: users.vendorRole,
      twoFactorEnabled: users.twoFactorEnabled,
    })
    .from(users)
    .where(isNotNull(users.vendorRole))
    .orderBy(asc(users.name))
  return c.json(
    z
      .array(vendorStaffMemberSchema)
      .parse(rows.map((row) => ({ ...row, twoFactorEnabled: row.twoFactorEnabled ?? false }))),
    200,
  )
})
