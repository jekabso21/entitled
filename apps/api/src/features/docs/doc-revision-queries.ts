import type { DocPageRevision, DocPageRevisionSummary } from '@entitled/contracts/docs'
import type { Queryable } from '@entitled/db'
import { docPageRevisions, users } from '@entitled/db/schema'
import { and, desc, eq } from 'drizzle-orm'

const summaryColumns = {
  id: docPageRevisions.id,
  pageId: docPageRevisions.pageId,
  title: docPageRevisions.title,
  createdAt: docPageRevisions.createdAt,
  createdByName: users.name,
}

type SummaryRow = { createdAt: Date; createdByName: string | null } & Omit<
  DocPageRevisionSummary,
  'createdAt' | 'createdByName'
>

const toSummary = (row: SummaryRow): DocPageRevisionSummary => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
})

export async function listDocRevisions(db: Queryable, pageId: string) {
  const rows = await db
    .select(summaryColumns)
    .from(docPageRevisions)
    .leftJoin(users, eq(users.id, docPageRevisions.createdByUserId))
    .where(eq(docPageRevisions.pageId, pageId))
    .orderBy(desc(docPageRevisions.createdAt), desc(docPageRevisions.id))
    .limit(200)
  return rows.map(toSummary)
}

export async function findDocRevision(
  db: Queryable,
  pageId: string,
  revisionId: string,
): Promise<DocPageRevision | null> {
  const [row] = await db
    .select({ ...summaryColumns, body: docPageRevisions.body })
    .from(docPageRevisions)
    .leftJoin(users, eq(users.id, docPageRevisions.createdByUserId))
    .where(and(eq(docPageRevisions.pageId, pageId), eq(docPageRevisions.id, revisionId)))
  return row ? { ...toSummary(row), body: row.body } : null
}
