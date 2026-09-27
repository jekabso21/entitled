import { sql } from 'drizzle-orm'
import { db } from '#lib/db.ts'

type QueuedEmail = { to: string; subject: string; text: string }

export async function findQueuedEmails(to: string) {
  const result = await db.execute<{ data: QueuedEmail }>(
    sql`select data from pgboss.job where name = 'email.send' and data->>'to' = ${to}`,
  )
  return result.rows.map((row) => row.data)
}

export async function findInvitationToken(to: string) {
  const [email] = await findQueuedEmails(to)
  const token = email?.text.match(/\/invite\/([\w-]+)/)?.[1]
  if (!token) throw new Error(`no invitation email queued for ${to}`)
  return token
}
