import { z } from 'zod'

export const artifactChecksumQueue = 'artifact.checksum'

export const artifactChecksumJobSchema = z.strictObject({
  artifactId: z.uuid(),
})

export type ArtifactChecksumJob = z.infer<typeof artifactChecksumJobSchema>
