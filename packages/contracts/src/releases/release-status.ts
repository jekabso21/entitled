import { z } from 'zod'

export const releaseStatusSchema = z.enum(['draft', 'published', 'archived'])

export type ReleaseStatus = z.infer<typeof releaseStatusSchema>
