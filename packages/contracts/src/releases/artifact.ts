import { z } from 'zod'

export const artifactStatusSchema = z.enum(['pending', 'processing', 'ready', 'failed'])

export const artifactSchema = z.object({
  id: z.uuid(),
  releaseId: z.uuid(),
  fileName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int(),
  status: artifactStatusSchema,
  sha256: z.string().nullable(),
  createdAt: z.iso.datetime(),
})

export type Artifact = z.infer<typeof artifactSchema>
