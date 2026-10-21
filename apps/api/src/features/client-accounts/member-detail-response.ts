import { clientAccountDetailSchema } from '@entitled/contracts/client-accounts'
import { db } from '#lib/db.ts'
import { findClientAccountDetail } from './client-account-queries.ts'

export const memberDetailResponse = {
  description: 'Client account',
  content: { 'application/json': { schema: clientAccountDetailSchema } },
}

export async function loadAccountDetail(clientAccountId: string) {
  const account = await findClientAccountDetail(db, clientAccountId)
  if (!account) throw new Error(`Client account ${clientAccountId} vanished after a write`)
  return account
}
