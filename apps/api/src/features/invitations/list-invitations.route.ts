import { invitationSchema } from '@entitled/contracts/invitations'
import { createRoute, z } from '@hono/zod-openapi'
import { requireVendorRole } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { listPendingInvitations } from './invitation-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/invitations',
  tags: ['Invitations'],
  summary: 'List pending invitations (vendor admin)',
  request: { query: z.object({ clientAccountId: z.uuid().optional() }) },
  responses: {
    200: {
      description: 'Pending invitations',
      content: { 'application/json': { schema: z.array(invitationSchema) } },
    },
  },
})

export const listInvitationsRoute = createRouter().openapi(route, async (c) => {
  requireVendorRole(c, ['admin'])
  const { clientAccountId } = c.req.valid('query')
  return c.json(await listPendingInvitations(db, clientAccountId), 200)
})
