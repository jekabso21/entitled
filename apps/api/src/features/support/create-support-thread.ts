import type { CreateSupportThreadInput } from '@entitled/contracts/support'
import { entitlements, members, supportMessages, supportThreads, users } from '@entitled/db/schema'
import { and, eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { DomainError } from '#lib/domain-error.ts'
import { loadProductAccess } from '#lib/product-access.ts'
import { isReleaseVisible } from '#lib/release-visibility.ts'
import type { TransactionScope } from '#lib/transaction.ts'
import { linkAttachments } from './link-attachments.ts'
import { notifySupportMessage } from './notify-support-message.ts'

export async function createSupportThread(
  scope: TransactionScope,
  actor: Actor,
  input: CreateSupportThreadInput,
) {
  const { tx } = scope
  const clientAccountId = await resolveClientAccount(tx, actor, input.clientAccountId)

  const [entitled] = await tx
    .select({ id: entitlements.id })
    .from(entitlements)
    .where(
      and(
        eq(entitlements.clientAccountId, clientAccountId),
        eq(entitlements.productId, input.productId),
      ),
    )
  if (!entitled) throw new DomainError('not_found', 'Product not found')

  if (input.releaseId) await assertReleaseVisible(tx, actor, input.productId, input.releaseId)

  const [thread] = await tx
    .insert(supportThreads)
    .values({
      clientAccountId,
      productId: input.productId,
      releaseId: input.releaseId,
      subject: input.subject,
      createdByUserId: actor.userId,
    })
    .returning({ id: supportThreads.id })
  if (!thread) throw new Error('Thread insert returned no row')

  const [message] = await tx
    .insert(supportMessages)
    .values({ threadId: thread.id, authorUserId: actor.userId, body: input.body })
    .returning({ id: supportMessages.id })
  if (!message) throw new Error('Message insert returned no row')
  await linkAttachments(tx, actor, message.id, input.attachmentIds)

  const [author] = await tx
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, actor.userId))
  await notifySupportMessage(scope, {
    threadId: thread.id,
    authorUserId: actor.userId,
    authorName: author?.name ?? actor.email,
    fromVendor: false,
    body: input.body,
  })
  return thread.id
}

async function resolveClientAccount(
  tx: TransactionScope['tx'],
  actor: Actor,
  requested: string | undefined,
) {
  if (actor.vendorRole) {
    throw new DomainError('forbidden', 'Support requests are opened by client users')
  }
  const memberships = await tx
    .select({ accountId: members.organizationId })
    .from(members)
    .where(eq(members.userId, actor.userId))
  const ids = memberships.map((membership) => membership.accountId)
  if (requested) {
    if (!ids.includes(requested)) throw new DomainError('forbidden', 'Not a member of this account')
    return requested
  }
  const [only] = ids
  if (ids.length !== 1 || !only) {
    throw new DomainError('invalid_state', 'Choose which client account this request is for')
  }
  return only
}

async function assertReleaseVisible(
  tx: TransactionScope['tx'],
  actor: Actor,
  productId: string,
  releaseId: string,
) {
  const release = await tx.query.releases.findFirst({
    where: { id: releaseId, productId },
    with: { product: { with: { revisions: true } } },
  })
  const access = await loadProductAccess(tx, actor)
  if (!release?.product || !isReleaseVisible(access, release, release.product.revisions)) {
    throw new DomainError('not_found', 'Release not found')
  }
}
