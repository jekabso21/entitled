import { z } from 'zod'

export const updateReleaseInputSchema = z
  .strictObject({
    version: z.string().trim().min(1).max(64),
    title: z.string().trim().max(200),
    changelog: z.string().max(200_000),
    installInstructions: z.string().max(200_000),
    minRevisionId: z.uuid().nullable(),
    maxRevisionId: z.uuid().nullable(),
  })
  .partial()

export type UpdateReleaseInput = z.infer<typeof updateReleaseInputSchema>
