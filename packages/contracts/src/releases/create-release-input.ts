import { z } from 'zod'

export const createReleaseInputSchema = z.strictObject({
  productId: z.uuid(),
  version: z.string().trim().min(1).max(64),
  title: z.string().trim().max(200).default(''),
  changelog: z.string().max(200_000).default(''),
  installInstructions: z.string().max(200_000).default(''),
  minRevisionId: z.uuid().nullable().default(null),
  maxRevisionId: z.uuid().nullable().default(null),
})

export type CreateReleaseInput = z.infer<typeof createReleaseInputSchema>
