import { z } from 'zod'

export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(63)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: 'Use lowercase letters, digits and dashes' })

export const createClientAccountInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(200),
  slug: slugSchema,
})

export type CreateClientAccountInput = z.infer<typeof createClientAccountInputSchema>
