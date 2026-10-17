import { members, supportMessages, supportThreads, users } from '@entitled/db/schema'
import { and, eq, inArray, isNull, ne } from 'drizzle-orm'
import { env } from '#config/env.ts'
import { getBranding } from '#lib/install-settings.ts'
import type { TransactionScope } from '#lib/transaction.ts'

type NewMessage = {
  threadId: string
  authorUserId: string
  authorName: string
  fromVendor: boolean
  body: string
}

// Client messages reach vendor admins and support staff; vendor replies reach the client
// users taking part in the thread. Internal notes never trigger mail.
export async function notifySupportMessage({ tx, enqueue }: TransactionScope, message: NewMessage) {
  const [thread] = await tx
    .select({
      subject: supportThreads.subject,
      clientAccountId: supportThreads.clientAccountId,
      createdByUserId: supportThreads.createdByUserId,
    })
    .from(supportThreads)
    .where(eq(supportThreads.id, message.threadId))
  if (!thread) return

  const recipients = message.fromVendor
    ? await clientParticipants(tx, message.threadId, thread)
    : await tx
        .select({ email: users.email })
        .from(users)
        .where(inArray(users.vendorRole, ['admin', 'support']))

  const { portalName } = await getBranding(tx)
  const path = message.fromVendor
    ? `/support/${message.threadId}`
    : `/admin/support/${message.threadId}`
  const link = new URL(path, env.WEB_URL).toString()
  const text = `${message.authorName} wrote:\n\n${message.body}\n\nReply in the portal: ${link}`

  for (const { email } of recipients) {
    await enqueue('email.send', { to: email, subject: `[${portalName}] ${thread.subject}`, text })
  }

  async function clientParticipants(
    db: TransactionScope['tx'],
    threadId: string,
    {
      clientAccountId,
      createdByUserId,
    }: { clientAccountId: string; createdByUserId: string | null },
  ) {
    const authors = await db
      .selectDistinct({ id: supportMessages.authorUserId })
      .from(supportMessages)
      .where(eq(supportMessages.threadId, threadId))
    const ids = [createdByUserId, ...authors.map((author) => author.id)].filter(
      (id): id is string => id !== null && id !== message.authorUserId,
    )
    if (ids.length === 0) return []
    // Only people still in the client account, and never vendor staff, get client mail.
    return db
      .selectDistinct({ email: users.email })
      .from(users)
      .innerJoin(members, eq(members.userId, users.id))
      .where(
        and(
          inArray(users.id, ids),
          eq(members.organizationId, clientAccountId),
          isNull(users.vendorRole),
          ne(users.id, message.authorUserId),
        ),
      )
  }
}
