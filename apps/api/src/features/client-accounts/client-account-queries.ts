import {
  type ClientAccount,
  type ClientAccountDetail,
  clientAccountDetailSchema,
} from '@entitled/contracts/client-accounts'
import type { Queryable } from '@entitled/db'
import { members, organizations, users } from '@entitled/db/schema'
import { asc, count, eq } from 'drizzle-orm'

export async function listClientAccounts(db: Queryable): Promise<ClientAccount[]> {
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      createdAt: organizations.createdAt,
      memberCount: count(members.id),
    })
    .from(organizations)
    .leftJoin(members, eq(members.organizationId, organizations.id))
    .groupBy(organizations.id)
    .orderBy(asc(organizations.name))

  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))
}

export async function findClientAccountDetail(
  db: Queryable,
  clientAccountId: string,
): Promise<ClientAccountDetail | null> {
  const [account] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, clientAccountId))
  if (!account) return null

  const accountMembers = await db
    .select({ userId: users.id, name: users.name, email: users.email, role: members.role })
    .from(members)
    .innerJoin(users, eq(users.id, members.userId))
    .where(eq(members.organizationId, clientAccountId))
    .orderBy(asc(users.name))

  return clientAccountDetailSchema.parse({
    id: account.id,
    name: account.name,
    slug: account.slug,
    createdAt: account.createdAt.toISOString(),
    members: accountMembers,
  })
}
