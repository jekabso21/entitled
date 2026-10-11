import type { RequestIdVariables } from 'hono/request-id'
import type { Actor } from '#lib/actor.ts'
import type { AuthSession } from '#lib/auth.ts'

export type SessionUser = AuthSession['user']

export type AppEnv = {
  Variables: RequestIdVariables & {
    user: SessionUser | null
    session: AuthSession['session'] | null
    // Set when the request authenticated with a CI API key instead of a session.
    apiKeyActor: Actor | null
  }
}
