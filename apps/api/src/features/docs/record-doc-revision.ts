import type { Queryable } from '@entitled/db'
import { docPageRevisions } from '@entitled/db/schema'

type SavedPage = { id: string; title: string; body: string }

export async function recordDocRevisions(
  tx: Queryable,
  pages: readonly SavedPage[],
  userId: string,
) {
  if (!pages.length) return
  await tx.insert(docPageRevisions).values(
    pages.map((page) => ({
      pageId: page.id,
      title: page.title,
      body: page.body,
      createdByUserId: userId,
    })),
  )
}
