import { z } from 'zod'

export const releaseAudienceSchema = z.enum(['entitled', 'selected'])

export type ReleaseAudience = z.infer<typeof releaseAudienceSchema>
