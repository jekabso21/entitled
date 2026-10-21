import type { Queryable } from '@entitled/db'
import { apikeys, sessions } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'

// Signs the user out everywhere and revokes the CI keys they own, so lost access takes
// effect immediately rather than when a session happens to expire.
export async function endUserSessions(db: Queryable, userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId))
  await db.delete(apikeys).where(eq(apikeys.referenceId, userId))
}
