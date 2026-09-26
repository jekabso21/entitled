import type { ClientAccount, CreateClientAccountInput } from '@entitled/contracts/client-accounts'
import { organizations } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'

export async function createClientAccount(
  { tx }: TransactionScope,
  actor: Actor,
  input: CreateClientAccountInput,
): Promise<ClientAccount> {
  const existing = await tx
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, input.slug))
  if (existing.length > 0)
    throw new DomainError('conflict', 'A client account with this slug exists')

  const [account] = await tx
    .insert(organizations)
    .values({ name: input.name, slug: input.slug, createdAt: new Date() })
    .returning()
  if (!account) throw new Error('Client account insert returned no row')

  await recordAudit(tx, {
    actorUserId: actor.userId,
    action: 'client_account.created',
    subjectType: 'client_account',
    subjectId: account.id,
    metadata: { name: account.name, slug: account.slug },
  })

  return {
    id: account.id,
    name: account.name,
    slug: account.slug,
    memberCount: 0,
    createdAt: account.createdAt.toISOString(),
  }
}
