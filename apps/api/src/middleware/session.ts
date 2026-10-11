import { HTTPException } from 'hono/http-exception'
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '#lib/app-env.ts'
import { auth } from '#lib/auth.ts'
import { readApiKey, resolveApiKeyActor } from '#lib/resolve-api-key-actor.ts'

export const session = createMiddleware<AppEnv>(async (c, next) => {
  c.set('apiKeyActor', null)
  const apiKey = readApiKey(c.req.raw.headers)
  if (apiKey) {
    const actor = await resolveApiKeyActor(apiKey)
    if (!actor) throw new HTTPException(401, { message: 'Invalid or expired API key' })
    c.set('user', null)
    c.set('session', null)
    c.set('apiKeyActor', actor)
    return next()
  }

  const result = await auth.api.getSession({ headers: c.req.raw.headers })
  c.set('user', result?.user ?? null)
  c.set('session', result?.session ?? null)
  await next()
})
