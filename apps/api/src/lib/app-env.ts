import type { RequestIdVariables } from 'hono/request-id'
import type { AuthSession } from '#lib/auth.ts'

export type AppEnv = {
  Variables: RequestIdVariables & {
    user: AuthSession['user'] | null
    session: AuthSession['session'] | null
  }
}
