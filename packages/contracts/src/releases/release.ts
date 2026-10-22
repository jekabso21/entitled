import { z } from 'zod'
import { artifactSchema } from './artifact.ts'
import { releaseAudienceSchema } from './release-audience.ts'
import { releaseStatusSchema } from './release-status.ts'

export const releaseSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  version: z.string(),
  title: z.string(),
  status: releaseStatusSchema,
  audience: releaseAudienceSchema,
  // Filled for vendor staff only; clients never learn which other accounts got a release.
  clientAccountIds: z.array(z.uuid()),
  changelog: z.string(),
  changelogHtml: z.string(),
  installInstructions: z.string(),
  installInstructionsHtml: z.string(),
  minRevisionId: z.uuid().nullable(),
  maxRevisionId: z.uuid().nullable(),
  publishedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  artifacts: z.array(artifactSchema),
})

export type Release = z.infer<typeof releaseSchema>
