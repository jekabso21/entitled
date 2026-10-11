import { type VendorRole, vendorRoleSchema } from '@entitled/contracts/accounts'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '#lib/app-env.ts'

export type Actor = {
  userId: string
  email: string
  vendorRole: VendorRole | null
  // Present when a CI API key acts on behalf of its owner.
  apiKeyId: string | null
}

type ActorOptions = {
  // API keys only reach routes that opt in; everything else needs a signed-in user.
  allowApiKey?: boolean
}

export function parseVendorRole(value: unknown) {
  const parsed = vendorRoleSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function requireActor(c: Context<AppEnv>, options: ActorOptions = {}): Actor {
  const user = c.get('user')
  if (user) {
    return {
      userId: user.id,
      email: user.email,
      vendorRole: parseVendorRole(user.vendorRole),
      apiKeyId: null,
    }
  }
  const apiKeyActor = c.get('apiKeyActor')
  if (apiKeyActor) {
    if (!options.allowApiKey) {
      throw new HTTPException(403, { message: 'API keys can only call the release API' })
    }
    return apiKeyActor
  }
  throw new HTTPException(401, { message: 'Sign in required' })
}

export function requireVendorRole(
  c: Context<AppEnv>,
  allowed: readonly VendorRole[],
  options: ActorOptions = {},
): Actor {
  const actor = requireActor(c, options)
  if (!actor.vendorRole || !allowed.includes(actor.vendorRole)) {
    throw new HTTPException(403, { message: 'Not allowed for your role' })
  }
  return actor
}
