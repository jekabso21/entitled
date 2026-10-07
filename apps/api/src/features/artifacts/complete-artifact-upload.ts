import { artifacts } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import { storedObjectSize } from '#lib/artifact-storage.ts'
import { DomainError } from '#lib/domain-error.ts'
import type { TransactionScope } from '#lib/transaction.ts'

export async function completeArtifactUpload(
  { tx, enqueue }: TransactionScope,
  artifactId: string,
) {
  const [artifact] = await tx
    .select()
    .from(artifacts)
    .where(eq(artifacts.id, artifactId))
    .for('update')
  if (!artifact) throw new DomainError('not_found', 'Artifact not found')
  if (artifact.status !== 'pending') {
    throw new DomainError('invalid_state', 'This upload was already completed')
  }

  const size = await storedObjectSize(artifact.storageKey)
  if (size === null) throw new DomainError('invalid_state', 'The file has not been uploaded yet')
  if (size !== artifact.sizeBytes) {
    await tx.update(artifacts).set({ status: 'failed' }).where(eq(artifacts.id, artifactId))
    return 'failed' as const
  }

  await tx.update(artifacts).set({ status: 'processing' }).where(eq(artifacts.id, artifactId))
  await enqueue('artifact.checksum', { artifactId })
  return 'processing' as const
}
