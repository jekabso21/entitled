import { createInvitationInputSchema, invitationSchema } from '@entitled/contracts/invitations'
import { createRoute } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { createInvitation } from './create-invitation.ts'

const route = createRoute({
  method: 'post',
  path: '/invitations',
  tags: ['Invitations'],
  summary: 'Invite vendor staff (vendor admin) or a client user (vendor admin or client admin)',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: createInvitationInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Invitation sent',
      content: { 'application/json': { schema: invitationSchema } },
    },
  },
})

export const createInvitationRoute = createRouter().openapi(route, async (c) => {
  const actor = requireActor(c)
  const input = c.req.valid('json')
  const invitation = await withTransaction((scope) => createInvitation(scope, actor, input))
  return c.json(invitation, 201)
})
