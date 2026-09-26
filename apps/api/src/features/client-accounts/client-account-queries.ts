import type { ClientAccount } from '@entitled/contracts/client-accounts'
import type { Queryable } from '@entitled/db'
import { members, organizations } from '@entitled/db/schema'
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
