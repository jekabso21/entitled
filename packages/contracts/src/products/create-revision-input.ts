import { z } from 'zod'

export const createRevisionInputSchema = z.strictObject({
  code: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^[A-Za-z0-9._-]+$/, { error: 'Use letters, digits, dots, dashes or underscores' }),
  name: z.string().trim().min(1).max(200),
})

export type CreateRevisionInput = z.infer<typeof createRevisionInputSchema>
