import type { ArtifactUpload, CreateArtifactUploadInput } from '@entitled/contracts/releases'
import { artifacts, releases } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import type { Actor } from '#lib/actor.ts'
import { artifactStorageKey, presignUpload } from '#lib/object-storage.ts'
import { auditActor, recordAudit } from '#lib/audit.ts'
import { DomainError } from '#lib/domain-error.ts'
import { toIso } from '#lib/serialize-date.ts'
import type { TransactionScope } from '#lib/transaction.ts'

export async function createArtifactUpload(
  { tx }: TransactionScope,
  actor: Actor,
  releaseId: string,
  input: CreateArtifactUploadInput,
): Promise<ArtifactUpload> {
  const [release] = await tx
    .select({ id: releases.id, status: releases.status })
    .from(releases)
    .where(eq(releases.id, releaseId))
  if (!release) throw new DomainError('not_found', 'Release not found')
  if (release.status === 'archived') {
    throw new DomainError('invalid_state', 'Archived releases cannot get new files')
  }

  const id = crypto.randomUUID()
  const storageKey = artifactStorageKey(releaseId, id, input.fileName)
  const [artifact] = await tx
    .insert(artifacts)
    .values({
      id,
      releaseId,
      fileName: input.fileName,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      expectedSha256: input.sha256 ?? null,
      storageKey,
    })
    .returning()
  if (!artifact) throw new Error('Artifact insert returned no row')

  await recordAudit(tx, {
    ...auditActor(actor),
    action: 'artifact.upload_started',
    subjectType: 'release',
    subjectId: releaseId,
    metadata: { artifactId: id, fileName: input.fileName, sizeBytes: input.sizeBytes },
  })

  const upload = await presignUpload(storageKey, input.contentType, input.sizeBytes)
  return {
    artifact: {
      id: artifact.id,
      releaseId,
      fileName: artifact.fileName,
      contentType: artifact.contentType,
      sizeBytes: artifact.sizeBytes,
      status: artifact.status,
      sha256: null,
      createdAt: toIso(artifact.createdAt),
    },
    uploadUrl: upload.url,
    uploadHeaders: upload.headers,
  }
}
