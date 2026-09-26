import { currentUserSchema } from '@entitled/contracts/accounts'
import { members, organizations } from '@entitled/db/schema'
import { createRoute } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'

const route = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Accounts'],
  summary: 'The signed-in user with their client account memberships',
  responses: {
    200: {
      description: 'Current user',
      content: { 'application/json': { schema: currentUserSchema } },
    },
  },
})

export const getMe = createRouter().openapi(route, async (c) => {
  const actor = requireActor(c)
  const user = c.get('user')
  const memberships = await db
    .select({
      clientAccountId: organizations.id,
      clientAccountName: organizations.name,
      role: members.role,
    })
    .from(members)
    .innerJoin(organizations, eq(organizations.id, members.organizationId))
    .where(eq(members.userId, actor.userId))

  return c.json(
    currentUserSchema.parse({
      id: actor.userId,
      name: user?.name,
      email: actor.email,
      vendorRole: actor.vendorRole,
      twoFactorEnabled: user?.twoFactorEnabled ?? false,
      memberships,
    }),
    200,
  )
})
