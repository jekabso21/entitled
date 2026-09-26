import { z } from 'zod'

export const clientAccountSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  memberCount: z.number().int(),
  createdAt: z.iso.datetime(),
})

export type ClientAccount = z.infer<typeof clientAccountSchema>
