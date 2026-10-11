import { users } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import { type Actor, parseVendorRole } from '#lib/actor.ts'
import { auth } from '#lib/auth.ts'
import { db } from '#lib/db.ts'

const RELEASE_PERMISSIONS = { releases: ['write'] }

export function readApiKey(headers: Headers) {
  const bearer = headers.get('authorization')?.match(/^Bearer\s+(ent_\S+)$/i)?.[1]
  return bearer ?? headers.get('x-api-key')
}

// A key acts as its owner, and only while the owner may still manage releases.
export async function resolveApiKeyActor(key: string): Promise<Actor | null> {
  const result = await auth.api.verifyApiKey({ body: { key, permissions: RELEASE_PERMISSIONS } })
  if (!result.valid || !result.key) return null

  const [owner] = await db
    .select({ id: users.id, email: users.email, vendorRole: users.vendorRole })
    .from(users)
    .where(eq(users.id, result.key.referenceId))
  const vendorRole = parseVendorRole(owner?.vendorRole)
  if (!owner || (vendorRole !== 'admin' && vendorRole !== 'editor')) return null

  return { userId: owner.id, email: owner.email, vendorRole: 'editor', apiKeyId: result.key.id }
}
