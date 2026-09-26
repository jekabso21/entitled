import type { VendorRole } from '@entitled/contracts/accounts'
import type { Queryable } from '@entitled/db'
import { accounts, users } from '@entitled/db/schema'
import { auth } from '#lib/auth.ts'

export type NewCredentialUser = {
  name: string
  email: string
  password: string
  vendorRole: VendorRole | null
}

// Written with Drizzle instead of Better Auth's adapter so it can join the caller's transaction;
// the password hash still comes from Better Auth so its sign-in can verify it.
export async function createCredentialUser(tx: Queryable, input: NewCredentialUser) {
  const context = await auth.$context
  const passwordHash = await context.password.hash(input.password)
  const [user] = await tx
    .insert(users)
    .values({
      name: input.name,
      email: input.email.toLowerCase(),
      emailVerified: true,
      vendorRole: input.vendorRole,
    })
    .returning({ id: users.id })
  if (!user) throw new Error('User insert returned no row')
  await tx.insert(accounts).values({
    userId: user.id,
    accountId: user.id,
    providerId: 'credential',
    password: passwordHash,
  })
  return user
}
