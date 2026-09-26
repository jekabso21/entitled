import { invitationPreviewSchema } from '@entitled/contracts/invitations'
import { createRoute, z } from '@hono/zod-openapi'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'
import { DomainError } from '#lib/domain-error.ts'
import { toIso } from '#lib/serialize-date.ts'
import { findPendingInvitationByToken } from './invitation-queries.ts'

const route = createRoute({
  method: 'get',
  path: '/invitations/{token}',
  tags: ['Invitations'],
  summary: 'Preview an invitation by its emailed token (public)',
  request: { params: z.object({ token: z.string().min(20).max(100) }) },
  responses: {
    200: {
      description: 'Invitation preview',
      content: { 'application/json': { schema: invitationPreviewSchema } },
    },
  },
})

export const getInvitationRoute = createRouter().openapi(route, async (c) => {
  const found = await findPendingInvitationByToken(db, c.req.valid('param').token)
  if (!found) throw new DomainError('not_found', 'Invitation is invalid or has expired')
  return c.json(
    {
      email: found.invitation.email,
      kind: found.invitation.kind,
      accountName: found.accountName,
      expiresAt: toIso(found.invitation.expiresAt),
    },
    200,
  )
})
