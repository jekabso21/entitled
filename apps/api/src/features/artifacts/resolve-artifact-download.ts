import type { Queryable } from '@entitled/db'
import type { Actor } from '#lib/actor.ts'
import { presignArtifactDownload } from '#lib/artifact-storage.ts'
import { recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import { loadProductAccess } from '#lib/product-access.ts'
import { isReleaseVisible } from '#lib/release-visibility.ts'

export async function resolveArtifactDownload(db: Queryable, actor: Actor, artifactId: string) {
  const artifact = await db.query.artifacts.findFirst({
    where: { id: artifactId },
    with: { release: { with: { product: { with: { revisions: true } } } } },
  })
  const release = artifact?.release
  const access = await loadProductAccess(db, actor)
  // Anything the caller may not download is reported as missing, so ids cannot be probed.
  if (
    artifact?.status !== 'ready' ||
    !release?.product ||
    !isReleaseVisible(access, release, release.product.revisions)
  ) {
    throw new DomainError('not_found', 'Artifact not found')
  }

  await recordAudit(db, {
    actorUserId: actor.userId,
    action: 'artifact.downloaded',
    subjectType: 'artifact',
    subjectId: artifact.id,
    metadata: { releaseId: release.id, version: release.version, fileName: artifact.fileName },
  })
  return presignArtifactDownload(artifact.storageKey, artifact.fileName)
}
