import type { RequestIdVariables } from 'hono/request-id'
import type { AuthSession } from '#lib/auth.ts'

export type SessionUser = AuthSession['user']

export type AppEnv = {
  Variables: RequestIdVariables & {
    user: SessionUser | null
    session: AuthSession['session'] | null
  }
}
