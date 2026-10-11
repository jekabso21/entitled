import type { CreateApiKeyInput, CreatedApiKey } from '@entitled/contracts/api-keys'
import type { Actor } from '#lib/actor.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { auth } from '#lib/auth.ts'
import { db } from '#lib/db.ts'
import { listApiKeys } from './api-key-queries.ts'

const DAY_SECONDS = 24 * 60 * 60

export async function createApiKey(actor: Actor, input: CreateApiKeyInput): Promise<CreatedApiKey> {
  const created = await auth.api.createApiKey({
    body: {
      name: input.name,
      userId: actor.userId,
      expiresIn: input.expiresInDays === null ? null : input.expiresInDays * DAY_SECONDS,
      permissions: { releases: ['write'] },
    },
  })

  await recordAudit(db, {
    ...auditActor(actor),
    action: 'api_key.created',
    subjectType: 'api_key',
    subjectId: created.id,
    metadata: { name: input.name },
  })

  const [listed] = await listApiKeys(db, created.id)
  if (!listed) throw new Error('Created API key not found')
  return { ...listed, key: created.key }
}
