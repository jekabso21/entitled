import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { revokeInvitation } from './revoke-invitation.ts'

const route = createRoute({
  method: 'delete',
  path: '/invitations/{invitationId}',
  tags: ['Invitations'],
  summary: 'Revoke a pending invitation so its link stops working',
  request: { params: z.object({ invitationId: z.uuid() }) },
  responses: { 204: { description: 'Revoked' } },
})

export const revokeInvitationRoute = createRouter().openapi(route, async (c) => {
  const actor = requireActor(c)
  await withTransaction((scope) =>
    revokeInvitation(scope, actor, c.req.valid('param').invitationId),
  )
  return c.body(null, 204)
})
