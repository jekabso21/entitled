import { acceptInvitationInputSchema } from '@entitled/contracts/invitations'
import { createRoute, z } from '@hono/zod-openapi'
import { requireActor } from '#lib/actor.ts'
import { auth } from '#lib/auth.ts'
import { createRouter } from '#lib/create-router.ts'
import { withTransaction } from '#lib/transaction.ts'
import { acceptInvitation } from './accept-invitation.ts'

// New users send name + password; people who already have an account sign in and send {}.
const bodySchema = z.union([acceptInvitationInputSchema, z.strictObject({})])

const route = createRoute({
  method: 'post',
  path: '/invitations/{token}/accept',
  tags: ['Invitations'],
  summary: 'Accept an invitation; creates the account and signs it in when new',
  request: {
    params: z.object({ token: z.string().min(20).max(100) }),
    body: { required: true, content: { 'application/json': { schema: bodySchema } } },
  },
  responses: {
    200: {
      description: 'Invitation accepted',
      content: { 'application/json': { schema: z.object({ userId: z.uuid() }) } },
    },
  },
})

export const acceptInvitationRoute = createRouter().openapi(route, async (c) => {
  const { token } = c.req.valid('param')
  const body = c.req.valid('json')
  const parsed = acceptInvitationInputSchema.safeParse(body)
  const newUser = parsed.success ? parsed.data : null
  const actor = c.get('user') ? requireActor(c) : null

  const result = await withTransaction((scope) =>
    acceptInvitation(scope, { token, actor, newUser }),
  )

  if (result.isNewUser && newUser) {
    const signIn = await auth.api.signInEmail({
      body: { email: result.email, password: newUser.password },
      headers: c.req.raw.headers,
      asResponse: true,
    })
    for (const cookie of signIn.headers.getSetCookie())
      c.header('Set-Cookie', cookie, { append: true })
  }
  return c.json({ userId: result.userId }, 200)
})
