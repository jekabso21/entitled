import { members, organizations, users } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import { env } from '#config/env.ts'
import { createCredentialUser } from '#lib/create-credential-user.ts'
import { db, pool } from '#lib/db.ts'
import { seedDemoCatalog } from './seed-demo-catalog.ts'

// Demo data for local and Docker previews. Safe to run repeatedly.
if (env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
  throw new Error('Refusing to seed demo data in production without ALLOW_DEMO_SEED=true')
}

const password = process.env.DEMO_PASSWORD ?? 'demo'

async function ensureUser(email: string, name: string, vendorRole: 'admin' | null) {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existing) return existing.id
  const user = await db.transaction((tx) =>
    createCredentialUser(tx, { name, email, password, vendorRole }),
  )
  return user.id
}

async function ensureClientAccount(name: string, slug: string) {
  const [existing] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, slug))
  if (existing) return existing.id
  const [account] = await db
    .insert(organizations)
    .values({ name, slug, createdAt: new Date() })
    .returning({ id: organizations.id })
  if (!account) throw new Error('Client account insert returned no row')
  return account.id
}

await ensureUser('vendor@demo.lv', 'Vendor Admin', 'admin')
const clientAccountId = await ensureClientAccount('Acme Robotics', 'acme-robotics')
const clientAdminId = await ensureUser('client@demo.lv', 'Acme Admin', null)
await db
  .insert(members)
  .values({
    organizationId: clientAccountId,
    userId: clientAdminId,
    role: 'admin',
    createdAt: new Date(),
  })
  .onConflictDoNothing()

await seedDemoCatalog(db, clientAccountId)

console.warn('demo data ready: vendor@demo.lv and client@demo.lv')
await pool.end()
