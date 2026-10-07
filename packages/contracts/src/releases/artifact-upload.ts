import { z } from 'zod'
import { artifactSchema } from './artifact.ts'

// A single presigned PUT is limited to 5 GiB by S3.
export const MAX_ARTIFACT_BYTES = 5 * 1024 ** 3

export const createArtifactUploadInputSchema = z.strictObject({
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[^/\\]+$/, { error: 'File name must not contain path separators' }),
  contentType: z.string().trim().min(1).max(255).default('application/octet-stream'),
  sizeBytes: z.number().int().positive().max(MAX_ARTIFACT_BYTES),
  sha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/, { error: 'Expected a lowercase hex SHA-256' })
    .optional(),
})

export type CreateArtifactUploadInput = z.infer<typeof createArtifactUploadInputSchema>

export const artifactUploadSchema = z.object({
  artifact: artifactSchema,
  uploadUrl: z.url(),
  // Headers the PUT must send exactly; they are part of the signature.
  uploadHeaders: z.record(z.string(), z.string()),
})

export type ArtifactUpload = z.infer<typeof artifactUploadSchema>
