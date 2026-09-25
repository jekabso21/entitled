import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '#lib/app-env.ts'
import { auth } from '#lib/auth.ts'

export const session = createMiddleware<AppEnv>(async (c, next) => {
  const result = await auth.api.getSession({ headers: c.req.raw.headers })
  c.set('user', result?.user ?? null)
  c.set('session', result?.session ?? null)
  await next()
})
