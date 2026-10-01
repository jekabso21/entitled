import { z } from 'zod'
import { slugSchema } from '../client-accounts/create-client-account-input.ts'

export const createProductInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(200),
  slug: slugSchema,
  description: z.string().trim().max(2000).default(''),
})

export type CreateProductInput = z.infer<typeof createProductInputSchema>
