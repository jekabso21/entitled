import { z } from 'zod'
import { artifactSchema } from './artifact.ts'
import { releaseStatusSchema } from './release-status.ts'

export const releaseSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  version: z.string(),
  title: z.string(),
  status: releaseStatusSchema,
  changelog: z.string(),
  installInstructions: z.string(),
  minRevisionId: z.uuid().nullable(),
  maxRevisionId: z.uuid().nullable(),
  publishedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  artifacts: z.array(artifactSchema),
})

export type Release = z.infer<typeof releaseSchema>
