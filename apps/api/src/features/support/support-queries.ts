import type {
  SupportThread,
  SupportThreadStatus,
  SupportThreadSummary,
} from '@entitled/contracts/support'
import type { Queryable } from '@entitled/db'
import { parseVendorRole } from '#lib/actor.ts'
import { renderMarkdownCached } from '#lib/markdown.ts'
import { toIso } from '#lib/serialize-date.ts'
import { canSeeThread, type SupportScope } from './support-access.ts'

const summaryRelations = {
  clientAccount: { columns: { name: true } },
  product: { columns: { name: true } },
  release: { columns: { version: true } },
} as const

type SummaryRow = {
  id: string
  subject: string
  status: SupportThreadStatus
  clientAccountId: string
  productId: string
  releaseId: string | null
  lastMessageAt: Date
  createdAt: Date
  clientAccount: { name: string } | null
  product: { name: string } | null
  release: { version: string } | null
}

function toSummary(row: SummaryRow): SupportThreadSummary {
  return {
    id: row.id,
    subject: row.subject,
    status: row.status,
    clientAccountId: row.clientAccountId,
    clientAccountName: row.clientAccount?.name ?? '',
    productId: row.productId,
    productName: row.product?.name ?? '',
    releaseId: row.releaseId,
    releaseVersion: row.release?.version ?? null,
    lastMessageAt: toIso(row.lastMessageAt),
    createdAt: toIso(row.createdAt),
  }
}

export async function listSupportThreads(
  db: Queryable,
  scope: SupportScope,
  status?: SupportThreadStatus,
) {
  if (scope.kind === 'client' && scope.accountIds.size === 0) return []
  const rows = await db.query.supportThreads.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(scope.kind === 'client' ? { clientAccountId: { in: [...scope.accountIds] } } : {}),
    },
    orderBy: { lastMessageAt: 'desc' },
    with: summaryRelations,
  })
  return rows.map(toSummary)
}

export async function findSupportThread(
  db: Queryable,
  scope: SupportScope,
  threadId: string,
): Promise<SupportThread | null> {
  const row = await db.query.supportThreads.findFirst({
    where: { id: threadId },
    with: {
      ...summaryRelations,
      messages: {
        // Internal notes never leave the server for client users.
        where: scope.kind === 'client' ? { internal: false } : {},
        orderBy: { createdAt: 'asc' },
        with: {
          author: { columns: { name: true, vendorRole: true } },
          attachments: { orderBy: { createdAt: 'asc' } },
        },
      },
    },
  })
  if (!row || !canSeeThread(scope, row)) return null

  const messages = await Promise.all(
    row.messages.map(async (message) => ({
      id: message.id,
      authorName: message.author?.name ?? null,
      fromVendor: parseVendorRole(message.author?.vendorRole) !== null,
      internal: message.internal,
      body: message.body,
      bodyHtml: await renderMarkdownCached(message.body),
      attachments: message.attachments.map(({ id, fileName, contentType, sizeBytes }) => ({
        id,
        fileName,
        contentType,
        sizeBytes,
      })),
      createdAt: toIso(message.createdAt),
    })),
  )
  return { ...toSummary(row), messages }
}
