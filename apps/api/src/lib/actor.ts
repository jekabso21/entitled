import { type VendorRole, vendorRoleSchema } from '@entitled/contracts/accounts'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '#lib/app-env.ts'

export type Actor = {
  userId: string
  email: string
  vendorRole: VendorRole | null
}

export function requireActor(c: Context<AppEnv>): Actor {
  const user = c.get('user')
  if (!user) throw new HTTPException(401, { message: 'Sign in required' })
  const vendorRole = vendorRoleSchema.safeParse(user.vendorRole)
  return {
    userId: user.id,
    email: user.email,
    vendorRole: vendorRole.success ? vendorRole.data : null,
  }
}

export function requireVendorRole(c: Context<AppEnv>, allowed: readonly VendorRole[]): Actor {
  const actor = requireActor(c)
  if (!actor.vendorRole || !allowed.includes(actor.vendorRole)) {
    throw new HTTPException(403, { message: 'Not allowed for your role' })
  }
  return actor
}
