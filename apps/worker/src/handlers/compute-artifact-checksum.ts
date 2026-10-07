import { GetObjectCommand } from '@aws-sdk/client-s3'
import { artifacts } from '@entitled/db/schema'
import { artifactChecksumJobSchema } from '@entitled/jobs'
import { eq } from 'drizzle-orm'
import type { Job } from 'pg-boss'
import { env } from '#config/env.ts'
import { db } from '#lib/db.ts'
import { s3 } from '#lib/s3-client.ts'
import { isByteStream, sha256OfStream } from '#lib/sha256-of-stream.ts'

export async function computeArtifactChecksums(jobs: Job<unknown>[]) {
  for (const job of jobs) {
    const { artifactId } = artifactChecksumJobSchema.parse(job.data)
    await computeChecksum(artifactId)
  }
}

async function computeChecksum(artifactId: string) {
  const [artifact] = await db.select().from(artifacts).where(eq(artifacts.id, artifactId))
  // Retries after success or after the artifact was deleted are no-ops.
  if (artifact?.status !== 'processing') return

  const object = await s3.send(
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: artifact.storageKey }),
  )
  // On Node the SDK returns a readable stream; anything else means a misconfigured client.
  if (!isByteStream(object.Body)) throw new Error(`No readable body for ${artifact.storageKey}`)
  const sha256 = await sha256OfStream(object.Body)

  const matches = !artifact.expectedSha256 || artifact.expectedSha256 === sha256
  await db
    .update(artifacts)
    .set({ sha256, status: matches ? 'ready' : 'failed' })
    .where(eq(artifacts.id, artifactId))
}
