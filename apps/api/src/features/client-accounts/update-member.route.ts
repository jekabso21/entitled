import { updateMemberInputSchema } from '@entitled/contracts/client-accounts'
import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { loadAccountDetail, memberDetailResponse } from './member-detail-response.ts'
import { updateMemberRole } from './update-member-role.ts'

const route = createRoute({
  method: 'patch',
  path: '/client-accounts/{clientAccountId}/members/{userId}',
  tags: ['Client accounts'],
  summary: "Change a member's role (vendor admin or client admin of the account)",
  request: {
    params: z.object({ clientAccountId: z.uuid(), userId: z.uuid() }),
    body: { required: true, content: { 'application/json': { schema: updateMemberInputSchema } } },
  },
  responses: { 200: memberDetailResponse },
})

export const updateMemberRoute = createRouter().openapi(route, async (c) => {
  const actor = requireActor(c)
  const { clientAccountId, userId } = c.req.valid('param')
  const { role } = c.req.valid('json')
  await withTransaction((scope) => updateMemberRole(scope, actor, clientAccountId, userId, role))
  return c.json(await loadAccountDetail(clientAccountId), 200)
})
