import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { loadAccountDetail, memberDetailResponse } from './member-detail-response.ts'
import { removeMember } from './remove-member.ts'

const route = createRoute({
  method: 'delete',
  path: '/client-accounts/{clientAccountId}/members/{userId}',
  tags: ['Client accounts'],
  summary: 'Remove someone from a client account (vendor admin or client admin of the account)',
  request: { params: z.object({ clientAccountId: z.uuid(), userId: z.uuid() }) },
  responses: { 200: memberDetailResponse },
})

export const removeMemberRoute = createRouter().openapi(route, async (c) => {
  const actor = requireActor(c)
  const { clientAccountId, userId } = c.req.valid('param')
  await withTransaction((scope) => removeMember(scope, actor, clientAccountId, userId))
  return c.json(await loadAccountDetail(clientAccountId), 200)
})
