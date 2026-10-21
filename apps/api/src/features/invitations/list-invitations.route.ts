import { invitationSchema } from '@entitled/contracts/invitations'
import { createRoute, z } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import { assertCanManageAccount } from '#lib/account-management-access.ts'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { listPendingInvitations } from './invitation-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/invitations',
  tags: ['Invitations'],
  summary: 'Pending invitations: all for vendor admins, their own account for client admins',
  request: { query: z.object({ clientAccountId: z.uuid().optional() }) },
  responses: {
    200: {
      description: 'Pending invitations',
      content: { 'application/json': { schema: z.array(invitationSchema) } },
    },
  },
})

export const listInvitationsRoute = createRouter().openapi(route, async (c) => {
  const actor = requireActor(c)
  const { clientAccountId } = c.req.valid('query')
  if (actor.vendorRole !== 'admin') {
    if (!clientAccountId) throw new HTTPException(403, { message: 'Not allowed for your role' })
    await assertCanManageAccount(db, actor, clientAccountId)
  }
  return c.json(await listPendingInvitations(db, clientAccountId), 200)
})
