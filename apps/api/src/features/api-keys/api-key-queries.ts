import type { ApiKey } from '@entitled/contracts/api-keys'
import type { Queryable } from '@entitled/db'
import { apikeys, users } from '@entitled/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import { toIso } from '#lib/serialize-date.ts'

export async function listApiKeys(db: Queryable, id?: string): Promise<ApiKey[]> {
  const rows = await db
    .select({
      id: apikeys.id,
      name: apikeys.name,
      start: apikeys.start,
      ownerEmail: users.email,
      createdAt: apikeys.createdAt,
      expiresAt: apikeys.expiresAt,
      lastUsedAt: apikeys.lastRequest,
    })
    .from(apikeys)
    // Better Auth stores the owner id as text.
    .leftJoin(users, eq(users.id, sql`${apikeys.referenceId}::uuid`))
    .where(id ? eq(apikeys.id, id) : undefined)
    .orderBy(desc(apikeys.createdAt))

  return rows.map((row) => ({
    ...row,
    name: row.name ?? 'Unnamed key',
    createdAt: toIso(row.createdAt),
    expiresAt: toIso(row.expiresAt),
    lastUsedAt: toIso(row.lastUsedAt),
  }))
}
