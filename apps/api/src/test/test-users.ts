import type { VendorRole } from '@entitled/contracts/accounts'
import { members, organizations } from '@entitled/db/schema'
import { createApp } from '#app.ts'
import { createCredentialUser } from '#lib/create-credential-user.ts'
import { db } from '#lib/db.ts'

export const TEST_PASSWORD = 'correct-horse-battery'
export const TEST_ORIGIN = 'http://localhost:3000'

let counter = 0
export function uniqueSuffix() {
  counter += 1
  return `${String(Date.now())}-${String(counter)}`
}

export async function signIn(email: string, password = TEST_PASSWORD) {
  const res = await createApp().request('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: TEST_ORIGIN },
    body: JSON.stringify({ email, password }),
  })
  if (res.status !== 200) throw new Error(`sign-in failed: ${String(res.status)}`)
  return res.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ')
}

export async function createSignedInUser(options: { vendorRole?: VendorRole } = {}) {
  const email = `user-${uniqueSuffix()}@example.test`
  const user = await db.transaction((tx) =>
    createCredentialUser(tx, {
      name: 'Test User',
      email,
      password: TEST_PASSWORD,
      vendorRole: options.vendorRole ?? null,
    }),
  )
  return { id: user.id, email, cookie: await signIn(email) }
}

export async function createClientAccountWith(userId: string, role: 'admin' | 'member') {
  const suffix = uniqueSuffix()
  const [account] = await db
    .insert(organizations)
    .values({ name: `Client ${suffix}`, slug: `client-${suffix}`, createdAt: new Date() })
    .returning({ id: organizations.id })
  if (!account) throw new Error('Client account insert returned no row')
  await db
    .insert(members)
    .values({ organizationId: account.id, userId, role, createdAt: new Date() })
  return account.id
}

export function jsonRequest(method: string, body: unknown, cookie?: string): RequestInit {
  return {
    method,
    headers: {
      'content-type': 'application/json',
      origin: TEST_ORIGIN,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  }
}
