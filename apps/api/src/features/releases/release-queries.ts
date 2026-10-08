import type { Release } from '@entitled/contracts/releases'
import type { Queryable } from '@entitled/db'
import type { ProductAccess } from '#lib/product-access.ts'
import { renderMarkdownCached } from '#lib/markdown.ts'
import { isReleaseVisible } from '#lib/release-visibility.ts'
import { toIso } from '#lib/serialize-date.ts'

async function queryReleases(db: Queryable, where: { productId: string } | { id: string }) {
  return db.query.releases.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    with: {
      artifacts: { orderBy: { fileName: 'asc' } },
      product: { with: { revisions: true } },
    },
  })
}

type ReleaseRow = Awaited<ReturnType<typeof queryReleases>>[number]

async function toRelease(row: ReleaseRow, access: ProductAccess): Promise<Release> {
  // Clients only ever see files whose checksum is verified.
  const artifacts =
    access.kind === 'all' ? row.artifacts : row.artifacts.filter((a) => a.status === 'ready')
  return {
    id: row.id,
    productId: row.productId,
    version: row.version,
    title: row.title,
    status: row.status,
    changelog: row.changelog,
    changelogHtml: await renderMarkdownCached(row.changelog),
    installInstructions: row.installInstructions,
    installInstructionsHtml: await renderMarkdownCached(row.installInstructions),
    minRevisionId: row.minRevisionId,
    maxRevisionId: row.maxRevisionId,
    publishedAt: toIso(row.publishedAt),
    createdAt: toIso(row.createdAt),
    artifacts: artifacts.map((artifact) => ({
      id: artifact.id,
      releaseId: artifact.releaseId,
      fileName: artifact.fileName,
      contentType: artifact.contentType,
      sizeBytes: artifact.sizeBytes,
      status: artifact.status,
      sha256: artifact.sha256,
      createdAt: toIso(artifact.createdAt),
    })),
  }
}

function visible(row: ReleaseRow, access: ProductAccess) {
  return row.product !== null && isReleaseVisible(access, row, row.product.revisions)
}

export async function listReleasesForProduct(
  db: Queryable,
  access: ProductAccess,
  productId: string,
) {
  const rows = await queryReleases(db, { productId })
  return Promise.all(
    rows.filter((row) => visible(row, access)).map((row) => toRelease(row, access)),
  )
}

export async function findRelease(db: Queryable, access: ProductAccess, releaseId: string) {
  const [row] = await queryReleases(db, { id: releaseId })
  return row && visible(row, access) ? toRelease(row, access) : null
}
